// frontend/src/app/(auth)/layout.js

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4">
      {children}
    </div>
  );
}