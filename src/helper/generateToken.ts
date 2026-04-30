import jwt from "jsonwebtoken";

const generateAccessToken = async (id: number, role: number | null, org_id: number) => {
  return await jwt.sign({ sub: id, role, org_id }, process.env.JWT_SECRET as string, {
    expiresIn: "1d",
  });
};

const generateRefreshToken = async (id: number, role: number | null, org_id: number) => {
  return await jwt.sign({ sub: id, role, org_id }, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
};

const decodeToken = async (token: string) => {
  return await jwt.verify(token, process.env.JWT_SECRET as string);
};

export { generateAccessToken, generateRefreshToken, decodeToken };
