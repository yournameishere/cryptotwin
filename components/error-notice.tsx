import { AlertTriangle } from "lucide-react";

export function ErrorNotice({
  title,
  message
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="notice notice-error" role="alert">
      <AlertTriangle aria-hidden size={20} />
      <div>
        <h2>{title}</h2>
        <p>{message}</p>
      </div>
    </div>
  );
}
