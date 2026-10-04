export function isTimeValid(dateTime: string | Date): boolean {
  const inputTime = new Date(dateTime).getTime();
  const currentTime = new Date().getTime();

  return inputTime > currentTime;
}