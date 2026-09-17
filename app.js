(function () {
  "use strict";

  // ---------- 1. 상태 변수 ----------
  const STORAGE_KEY = "nagging_tasks";
  const TRANSIENT_MS = 4000;
  const TICK_MS = 60000;

  let tasks = [];
  let lastAction = null; // { message, state, time }
  const notifiedLevels = {};

  const CHARACTER_EMOJI = {
    idle: "🙂",
    concerned: "😐",
    annoyed: "😑",
    angry: "😠",
    happy: "😄",
  };

  const LEVEL_STATE = ["idle", "concerned", "annoyed", "annoyed", "angry"];

  const MESSAGES = {
    level0: ["아직 여유는 있어. 그래도 잊지는 마.", "미리 해두면 나중에 편해."],
    level1: ["슬슬 시작해볼까?", "지금 조금 해두는 게 좋을 것 같은데."],
    level2: ["이제 진짜 해야 돼.", "또 마지막 날까지 미루려고?"],
    level3: ["시간 얼마 안 남았어.", "지금 시작 안 하면 또 밤새게 된다."],
    level4: ["지금 바로 시작해.", "이제 더 미룰 시간 없어."],
  };

  const START_MESSAGES = ["좋아, 지금부터 시작이야!", "그래, 해보자!"];
  const COMPLETE_MESSAGES_FAST = ["생각보다 빨리 끝냈는데?", "여유있게 끝냈네!"];
  const COMPLETE_MESSAGES_NORMAL = ["드디어 했네.", "고생했어!"];
  const OVERDUE_MESSAGE = "마감 시간이 지났어! 지금 바로 확인해.";
  const EMPTY_MESSAGE = "오늘은 할 일이 없네. 새로운 할 일을 등록해볼까?";
  const ALL_DONE_MESSAGE = "오늘 할 일 다 끝냈어! 완전 최고야.";

  // ---------- DOM refs ----------
  const el = {
    characterEmoji: document.getElementById("character-emoji"),
    characterTaskName: document.getElementById("character-task-name"),
    characterMessage: document.getElementById("character-message"),
    characterActions: document.getElementById("character-actions"),
    btnStart: document.getElementById("btn-start"),
    btnSnooze: document.getElementById("btn-snooze"),
    btnComplete: document.getElementById("btn-complete"),
    taskList: document.getElementById("task-list"),
    emptyMessage: document.getElementById("empty-message"),
    completedDetails: document.getElementById("completed-details"),
    completedList: document.getElementById("completed-list"),
    completedCount: document.getElementById("completed-count"),
    toggleFormBtn: document.getElementById("toggle-form-btn"),
    taskForm: document.getElementById("task-form"),
    cancelFormBtn: document.getElementById("cancel-form-btn"),
    inputTitle: document.getElementById("input-title"),
    inputDeadline: document.getElementById("input-deadline"),
    inputEstimated: document.getElementById("input-estimated"),
    notifyToggle: document.getElementById("notify-toggle"),
  };

  // ---------- 2. localStorage ----------
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  // ---------- 3-5. Task 생성/삭제/상태 변경 ----------
  function generateId() {
    return tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  }

  function addTask(title, deadlineISO, estimatedMinutes) {
    tasks.push({
      id: generateId(),
      title,
      deadline: deadlineISO,
      estimatedMinutes,
      status: "not_started",
      snoozeCount: 0,
      createdAt: new Date().toISOString(),
      nextReminderAt: null,
    });
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    render();
  }

  function setTransient(message, state) {
    lastAction = { message, state, time: Date.now() };
    render();
    setTimeout(() => {
      if (lastAction && Date.now() - lastAction.time >= TRANSIENT_MS) {
        lastAction = null;
        render();
      }
    }, TRANSIENT_MS + 50);
  }

  function startTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.status = "in_progress";
    saveTasks();
    setTransient(pick(START_MESSAGES), "idle");
  }

  function completeTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.status = "completed";
    task.completedAt = new Date().toISOString();
    saveTasks();
    setTransient(getCompleteMessage(task), "happy");
  }

  function snoozeTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    task.snoozeCount += 1;
    task.nextReminderAt = new Date(Date.now() + 30 * 60000).toISOString();
    saveTasks();
    render();
  }

  // ---------- 6-7. 시간 계산 / Urgency 계산 ----------
  function calculateRemainingTime(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate - now;
    const overdue = diffMs < 0;
    const absMs = Math.abs(diffMs);
    const totalMinutes = Math.floor(absMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    return { overdue, days, hours, minutes };
  }

  function formatRemaining(deadline) {
    const r = calculateRemainingTime(deadline);
    let text;
    if (r.days >= 1) text = `${r.days}일 ${r.hours}시간`;
    else if (r.hours >= 1) text = `${r.hours}시간 ${r.minutes}분`;
    else text = `${r.minutes}분`;
    return r.overdue ? `${text} 지남 (마감 초과)` : `${text} 남음`;
  }

  function getDDay(deadline) {
    const r = calculateRemainingTime(deadline);
    if (r.overdue) return "마감 초과";
    if (r.days === 0) return "D-day";
    return `D-${r.days}`;
  }

  function calculateUrgency(task) {
    const now = new Date();
    const deadline = new Date(task.deadline);
    const hoursLeft = (deadline - now) / (1000 * 60 * 60);
    const estimatedHours = task.estimatedMinutes / 60;

    if (hoursLeft <= estimatedHours * 1.5) return 4;
    if (hoursLeft <= 1) return 4;
    if (hoursLeft <= 6) return 3;
    if (hoursLeft <= 24) return 2;
    if (hoursLeft <= 72) return 1;
    return 0;
  }

  // ---------- 8. 캐릭터 메시지 생성 ----------
  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getNaggingMessage(level) {
    return pick(MESSAGES[`level${level}`]);
  }

  function getSnoozeMessage(count) {
    if (count === 1) return "알겠어. 30분 뒤에 다시 말할게.";
    if (count === 2) return "또 미루네?";
    if (count >= 3 && count < 5) return `지금 ${count}번째야.`;
    return "오늘 몇 번째 미루는 건지 알아?";
  }

  function getCompleteMessage(task) {
    const now = new Date();
    const deadline = new Date(task.deadline);
    const hoursLeft = (deadline - now) / (1000 * 60 * 60);
    const estimatedHours = task.estimatedMinutes / 60;
    if (hoursLeft > estimatedHours * 2) return pick(COMPLETE_MESSAGES_FAST);
    return pick(COMPLETE_MESSAGES_NORMAL);
  }

  function getMostUrgentTask(list) {
    const active = list.filter((t) => t.status !== "completed");
    if (active.length === 0) return null;
    const now = new Date();
    return active
      .slice()
      .sort((a, b) => {
        const aOverdue = new Date(a.deadline) < now;
        const bOverdue = new Date(b.deadline) < now;
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
        const levelDiff = calculateUrgency(b) - calculateUrgency(a);
        if (levelDiff !== 0) return levelDiff;
        return new Date(a.deadline) - new Date(b.deadline);
      })[0];
  }

  // ---------- 9. 캐릭터 업데이트 / 렌더링 ----------
  function updateCharacter() {
    if (lastAction && Date.now() - lastAction.time < TRANSIENT_MS) {
      el.characterEmoji.textContent = CHARACTER_EMOJI[lastAction.state];
      el.characterTaskName.textContent = "";
      el.characterMessage.textContent = lastAction.message;
      const urgent = getMostUrgentTask(tasks);
      toggleActions(urgent);
      return;
    }

    const active = tasks.filter((t) => t.status !== "completed");

    if (tasks.length === 0) {
      el.characterEmoji.textContent = CHARACTER_EMOJI.idle;
      el.characterTaskName.textContent = "";
      el.characterMessage.textContent = EMPTY_MESSAGE;
      toggleActions(null);
      return;
    }

    if (active.length === 0) {
      el.characterEmoji.textContent = CHARACTER_EMOJI.happy;
      el.characterTaskName.textContent = "";
      el.characterMessage.textContent = ALL_DONE_MESSAGE;
      toggleActions(null);
      return;
    }

    const task = getMostUrgentTask(tasks);
    const now = new Date();
    const overdue = new Date(task.deadline) < now;
    const level = calculateUrgency(task);

    let message, state;
    if (task.nextReminderAt && now < new Date(task.nextReminderAt)) {
      message = getSnoozeMessage(task.snoozeCount);
      state = task.snoozeCount >= 3 ? "angry" : task.snoozeCount === 2 ? "annoyed" : "concerned";
    } else if (overdue) {
      message = OVERDUE_MESSAGE;
      state = "angry";
    } else {
      message = getNaggingMessage(level);
      state = LEVEL_STATE[level];
    }

    el.characterEmoji.textContent = CHARACTER_EMOJI[state];
    el.characterTaskName.textContent = task.title;
    el.characterMessage.textContent = message;
    toggleActions(task);
  }

  function toggleActions(task) {
    if (!task) {
      el.characterActions.hidden = true;
      return;
    }
    el.characterActions.hidden = false;
    el.btnStart.hidden = task.status !== "not_started";
    el.btnStart.dataset.taskId = task.id;
    el.btnSnooze.dataset.taskId = task.id;
    el.btnComplete.dataset.taskId = task.id;
  }

  function renderTasks() {
    const active = tasks
      .filter((t) => t.status !== "completed")
      .slice()
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    const completed = tasks.filter((t) => t.status === "completed");
    const mostUrgentId = getMostUrgentTask(tasks) ? getMostUrgentTask(tasks).id : null;

    el.emptyMessage.hidden = tasks.length !== 0;
    el.taskList.innerHTML = active.map((t) => renderTaskItem(t, t.id === mostUrgentId)).join("");

    el.completedDetails.hidden = completed.length === 0;
    el.completedCount.textContent = completed.length;
    el.completedList.innerHTML = completed
      .slice()
      .reverse()
      .map((t) => renderTaskItem(t, false))
      .join("");
  }

  function renderTaskItem(task, isUrgent) {
    const dday = getDDay(task.deadline);
    const overdue = calculateRemainingTime(task.deadline).overdue;
    const statusLabel =
      task.status === "completed" ? "완료" : task.status === "in_progress" ? "진행중" : "아직 시작 안 함";
    const statusClass = task.status === "in_progress" ? " in-progress" : "";

    return `
      <li class="task-item${isUrgent ? " urgent" : ""}" data-id="${task.id}">
        <div class="task-info">
          <p class="task-title">${escapeHtml(task.title)}</p>
          <p class="task-meta">${task.status === "completed" ? "완료됨" : formatRemaining(task.deadline)}<span class="task-status${statusClass}">${statusLabel}</span></p>
        </div>
        <span class="task-dday${overdue && task.status !== "completed" ? " overdue" : ""}">${task.status === "completed" ? "" : dday}</span>
        <button class="delete-btn" data-delete-id="${task.id}" type="button" aria-label="삭제">×</button>
      </li>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function render() {
    renderTasks();
    updateCharacter();
  }

  // ---------- 알림 ----------
  function updateNotifyButton() {
    if (!("Notification" in window)) {
      el.notifyToggle.hidden = true;
      return;
    }
    const granted = Notification.permission === "granted";
    el.notifyToggle.textContent = granted ? "🔔 알림 켜짐" : "🔔 알림 끄짐";
    el.notifyToggle.classList.toggle("enabled", granted);
  }

  function checkAndNotify() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const task = getMostUrgentTask(tasks);
    if (!task) return;
    const level = calculateUrgency(task);
    if (level >= 3 && notifiedLevels[task.id] !== level) {
      new Notification(`${task.title} 아직 안 했지?`, { body: getNaggingMessage(level) });
      notifiedLevels[task.id] = level;
    }
  }

  // ---------- 10. Event Listener ----------
  function setupEventListeners() {
    el.characterActions.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || !btn.dataset.taskId) return;
      const id = Number(btn.dataset.taskId);
      if (btn === el.btnStart) startTask(id);
      else if (btn === el.btnSnooze) snoozeTask(id);
      else if (btn === el.btnComplete) completeTask(id);
    });

    document.addEventListener("click", (e) => {
      const delBtn = e.target.closest("[data-delete-id]");
      if (delBtn) deleteTask(Number(delBtn.dataset.deleteId));
    });

    el.toggleFormBtn.addEventListener("click", () => {
      el.taskForm.hidden = false;
      el.toggleFormBtn.hidden = true;
      el.inputTitle.focus();
    });

    el.cancelFormBtn.addEventListener("click", () => {
      el.taskForm.reset();
      el.taskForm.hidden = true;
      el.toggleFormBtn.hidden = false;
    });

    el.taskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = el.inputTitle.value.trim();
      const deadline = el.inputDeadline.value;
      const hours = parseFloat(el.inputEstimated.value);
      if (!title || !deadline || !hours || hours <= 0) return;
      addTask(title, deadline, Math.round(hours * 60));
      el.taskForm.reset();
      el.taskForm.hidden = true;
      el.toggleFormBtn.hidden = false;
    });

    el.notifyToggle.addEventListener("click", () => {
      if (!("Notification" in window)) return;
      if (Notification.permission === "default") {
        Notification.requestPermission().then(updateNotifyButton);
      } else {
        updateNotifyButton();
      }
    });
  }

  // ---------- init ----------
  function init() {
    tasks = loadTasks();
    setupEventListeners();
    updateNotifyButton();
    render();
    setInterval(() => {
      render();
      checkAndNotify();
    }, TICK_MS);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
