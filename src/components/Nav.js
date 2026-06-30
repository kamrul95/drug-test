import { getSession, canManageResults } from "@/lib/auth";
import NavBar from "@/components/NavBar";

export default async function Nav() {
  const session = await getSession();
  if (!session) return null;

  return (
    <NavBar
      name={session.name}
      role={session.role}
      staff={canManageResults(session.role)}
      isSuper={session.role === "superadmin"}
    />
  );
}
