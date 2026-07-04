import { Outlet } from "react-router-dom";
import { Header } from "../common/Header";

export function AppLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}
