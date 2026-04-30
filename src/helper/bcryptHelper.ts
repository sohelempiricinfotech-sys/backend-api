import bcrypt from "bcryptjs";
const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};
const validatePassword = async (password: string, hashedPassword: string) => {
  return await bcrypt.compare(password, hashedPassword);
};
export {
  hashPassword,
  validatePassword,
};