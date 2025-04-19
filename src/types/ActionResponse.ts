export default interface ActionResponse {
  status: "success" | "failure";
  message: string;
  data?: any;
}
