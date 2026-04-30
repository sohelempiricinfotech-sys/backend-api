export const paginationAndSorting = (
  page: number = 1,
  limit: number = 10,
  sortBy: string = "created_at",
  sortOrder: "asc" | "desc" = "desc"
) => {
  const offset = (page - 1) * limit;

  const obj: any = {}

  if (sortBy && sortOrder) obj[sortBy] = sortOrder;
  if (offset) obj["skip"] = Number(offset);
  if (limit) obj["take"] = Number(limit);

  return obj;
};
