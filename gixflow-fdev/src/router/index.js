import { createRouter, createWebHistory } from "vue-router";

// Importa i componenti
import DashboardPage from "../components/DashboardPage.vue";
import AppointmentsPage from "../components/appointments/AppointmentsPage.vue";
import AgendaSchedules from "../components/appointments/AgendaSchedules.vue";
import CalendarPage from "../components/appointments/CalendarPage.vue";
import PlanningPage from "../components/appointments/PlanningPage.vue";
import SideBar from "../components/SideBar.vue";
import TopBar from "../components/TopBar.vue";
import UserManagement from "../components/UserManagement.vue";
import LoginPage from "../components/LoginPage.vue";
import ReportsPage from "../components/ReportsPage.vue";
import ClientPage from "../components/ClientPage.vue";
import ContractsPage from "../components/ContractsPage.vue";
import ContractsNew from "../components/ContractsNew.vue";
import ContractsDetails from "../components/ContractsDetails.vue";
import EditTable from "../components/EditTable.vue";
import TablesList from "../components/TablesList.vue";
import LogsPage from "../components/LogsPage.vue";
import ApiPage from "../components/ApiPage.vue";
import CommAgPage from "../components/commissioningAg/CommAgPage.vue";
import CommOpPage from "../components/commissioningOp/CommOpPage.vue";
import UserProfile from "../components/UserProfile.vue";
import EmailConfigPage from "../components/EmailConfigPage.vue";

// REPORTS
import AppointmentsReport from "@/components/reports/AppointmentsReport.vue";
import ContractsByAgentReport from "@/components/reports/ContractsByAgentReport.vue";
import LocationEfficiencyReport from "@/components/reports/LocationEfficiencyReport.vue";
import OperatorPerformanceReport from "@/components/reports/OperatorPerformanceReport.vue";



// Definisci le rotte
const routes = [
  { path: "/login", name: "Login", component: LoginPage, meta: { requiresSidebar: false, requiresTopbar: false } }, // Accessibile a tutti
  { path: "/", name: "Dashboard", component: DashboardPage, meta: { requiresSidebar: true,  requiresAuth: true } },
  { path: "/appointments", name: "Appointments", component: AppointmentsPage, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/agenda-schedules", name: "AgendaSchedule", component: AgendaSchedules, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/calendar", name: "Calendar", component: CalendarPage, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/planning", name: "Planning", component: PlanningPage, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/sidebar", name: "SideBar", component: SideBar, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/topbar", name: "TopBar", component: TopBar, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/reports", name: "Reports", component: ReportsPage, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/clients", name: "Clients", component: ClientPage, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/contracts", name: "ContractsPage", component: ContractsPage, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/contracts/:id", name: "ContractsDetails", component: ContractsDetails, props: true, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/contracts/new", name: "ContractsNew", component: ContractsNew, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/settings/tables", name: "SettingsTables", component: TablesList, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/settings/tables/:tableName", component: EditTable, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/settings/logs", component: LogsPage, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/settings/generate-api-key", component: ApiPage, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/commissioning/agents", component: CommAgPage, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/commissioning/operators", component: CommOpPage, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/user/profile", name: "UserProfile", component: UserProfile, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/settings/email", name: "EmailConfigPage", component: EmailConfigPage, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/reports/appointments-report", name: "AppointmentsReport", component: AppointmentsReport, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/reports/contracts-by-agent-report", name: "ContractsByAgentReport", component: ContractsByAgentReport, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/reports/location-efficiency-report", name: "LocationEfficiencyReport", component: LocationEfficiencyReport, meta: { requiresSidebar: true, requiresAuth: true } },
  { path: "/reports/operator-performance-report", name: "OperatorPerformanceReport", component: OperatorPerformanceReport, meta: { requiresSidebar: true, requiresAuth: true } },


  // Pagine accessibili solo agli Admin
  { path: "/users", name: "UserManagement", component: UserManagement, meta: { requiresSidebar: true, requiresAuth: true, requiresAdmin: false } },
];

// Crea il router
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Protezione delle rotte
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(atob(token.split(".")[1])) : null; // Decodifica il payload JWT

  // Se la rotta richiede autenticazione e non c'è il token, reindirizza al login
  if (to.meta.requiresAuth && !token) {
    return next("/login");
  }

  // Se la rotta richiede un Admin e l'utente non è Admin, blocca l'accesso
  if (to.meta.requiresAdmin && (!user || user.role !== "admin")) {
    return next("/"); // Torna alla Dashboard se l'utente non è Admin
  }

  next(); // Se tutto è ok, prosegui
});

export default router;




