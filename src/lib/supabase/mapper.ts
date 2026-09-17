import type {
  AboutLink,
  AboutProfile,
  AboutRow,
  Project,
  ProjectInput,
  ProjectRow,
} from "@/types/project";

export function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    bookTitle: row.book_title,
    description: row.description ?? "",
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    projectUrl: row.project_url ?? undefined,
    githubUrl: row.github_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    bookColor: row.book_color,
    position: { x: row.position_x, y: row.position_y, z: row.position_z },
    rotation: { x: row.rotation_x, y: row.rotation_y, z: row.rotation_z },
    scale: { x: row.scale_x, y: row.scale_y, z: row.scale_z },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function projectToRow(input: ProjectInput): Omit<ProjectRow, "id" | "created_at" | "updated_at"> {
  return {
    name: input.name,
    book_title: input.bookTitle,
    description: input.description,
    start_date: input.startDate,
    end_date: input.endDate ?? null,
    project_url: input.projectUrl ?? null,
    github_url: input.githubUrl ?? null,
    image_url: input.imageUrl ?? null,
    book_color: input.bookColor,
    position_x: input.position.x,
    position_y: input.position.y,
    position_z: input.position.z,
    rotation_x: input.rotation.x,
    rotation_y: input.rotation.y,
    rotation_z: input.rotation.z,
    scale_x: input.scale.x,
    scale_y: input.scale.y,
    scale_z: input.scale.z,
  };
}

export function rowToAbout(row: AboutRow): AboutProfile {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    affiliation: row.affiliation ?? "",
    tagline: row.tagline ?? "",
    links: (row.links ?? []) as AboutLink[],
    updatedAt: row.updated_at,
  };
}
