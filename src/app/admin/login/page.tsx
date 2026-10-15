import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid place-items-center p-4 bg-[#151515]">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="mx-auto mb-6 w-44 rounded-xl bg-[#151515] p-3">
          <img src="/images/logo.webp" alt="Express Mix" width={459} height={191} className="w-full h-auto" />
        </div>
        <h1 className="text-xl font-bold text-center mb-6">ადმინ პანელი</h1>
        <LoginForm />
      </div>
    </div>
  );
}
