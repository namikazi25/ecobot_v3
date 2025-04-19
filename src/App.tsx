import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { ChatInterface } from "./ChatInterface";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold text-emerald-800">EcoBot</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 flex p-0">
        <Content />
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const sessions = useQuery(api.sessions.list);

  if (loggedInUser === undefined || sessions === undefined) {
    return (
      <div className="flex justify-center items-center w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="flex w-full">
      <Authenticated>
        <div className="flex w-full">
          <aside className="w-64 border-r bg-gray-50 p-4">
            <div className="mb-6">
              <h3 className="font-medium text-gray-900">Welcome, {loggedInUser?.email}</h3>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Your Chats</h4>
              <ul className="space-y-2">
                {sessions.map((session) => (
                  <li 
                    key={session._id}
                    className="p-2 rounded hover:bg-gray-100 cursor-pointer"
                  >
                    {session.name}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
          <div className="flex-1">
            <ChatInterface />
          </div>
        </div>
      </Authenticated>
      <Unauthenticated>
        <div className="max-w-md mx-auto p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-emerald-800 mb-4">Welcome to EcoBot</h1>
            <p className="text-gray-600">Sign in to start exploring ecological insights</p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
