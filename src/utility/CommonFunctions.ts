export const cleanObject = (obj: Record<string, any>) => {
  const cleanedObj: Record<string, any> = {};
  for (const key in obj) {
    const value = obj[key];
    console.log("Value for key", key, ":", value, isNaN(value));
    if (value !== "" && value !== null) {
      cleanedObj[key] = value;
    }
  }
  return cleanedObj;
};
