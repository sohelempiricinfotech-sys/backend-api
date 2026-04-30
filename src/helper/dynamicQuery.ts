import { Between, ILike } from "typeorm";

const dynamicFilter = (filters:any) => {
  const where: any = {};
  for (const key in filters) {
    const value = filters[key];
    if (value === null || value === undefined || value === "") continue;
    if (
      [
        "created_at",
        "updated_at",
        "deleted_at",
        "otp_expires_at",
        "login_attempts_at",
        "resume_view_reset_time",
        "file_download_reset_time",
      ].includes(key)
    ) {
      if (Array.isArray(value) && value.length === 2) {
        const [start, end] = value;
        where[key] = Between(new Date(start), new Date(end));
      }
      continue;
    }

    if (["email", "phone"].includes(key)) {
      where[key] = ILike(`%${value}%`);
      continue;
    }
    where[key] = value;
  }
  return where;
};



export { dynamicFilter };