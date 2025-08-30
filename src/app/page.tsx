"use client"

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Wallet, ArrowRightLeft, Shield, Send, Users, Settings, DollarSign, Banknote, AlertTriangle, CheckCircle2, TrendingUp, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

// ---------- Helpers ----------
const tokenPrices: Record<string, number> = {
  ETH: 3200,
  MATIC: 0.74,
  OP: 2.2,
  ARB: 1.25,
  SOL: 145,
  AVAX: 24.5, // Avalanche token price
};

const stablecoins = ["USDC", "USDT", "DAI", "USDP"] as const;
type Stablecoin = typeof stablecoins[number];

function fmtUSD(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}
function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}
function randomHex(len = 64) {
  const chars = "abcdef0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return "0x" + out;
}
function isEthAddress(str: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(str);
}

// ---------- Types ----------
interface Employee {
  id: string;
  name: string;
  wallet: string;
  verified: boolean;
  salaryUSD: number; // monthly
  split: { stable: number; offramp: number; btc: number };
  stablecoin: Stablecoin;
  jurisdiction: string;
}

interface PayrollRunQuote {
  totalUSD: number;
  token: string;
  tokenPrice: number;
  tokenAmount: number;
  gasUSD: number;
  feesUSD: number;
  slippagePct: number;
  stableBasket: Record<string, number>; // allocation %
}

interface PayoutReceipt {
  employeeId: string;
  txHash: string;
  status: "pending" | "confirmed" | "failed";
}

interface PayrollRun {
  id: string;
  createdAt: number;
  token: string;
  quote: PayrollRunQuote;
  receipts: PayoutReceipt[];
  status: "quoted" | "executed" | "settled";
}

// ---------- Demo seed data ----------
const seedEmployees: Employee[] = [
  {
    id: "e1",
    name: "Aisha Khan",
    wallet: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    verified: true,
    salaryUSD: 2800,
    split: { stable: 70, offramp: 20, btc: 10 },
    stablecoin: "USDC",
    jurisdiction: "IN",
  },
  {
    id: "e2",
    name: "Leo Martins",
    wallet: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    verified: true,
    salaryUSD: 3100,
    split: { stable: 60, offramp: 30, btc: 10 },
    stablecoin: "USDT",
    jurisdiction: "BR",
  },
  {
    id: "e3",
    name: "Mina Park",
    wallet: "0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEadBeeF",
    verified: false,
    salaryUSD: 2500,
    split: { stable: 80, offramp: 20, btc: 0 },
    stablecoin: "DAI",
    jurisdiction: "PH",
  },
];

// ---------- Quote logic (mock) ----------
function buildStableBasket(): Record<string, number> {
  // Simple diversified basket; could be AI-optimized.
  return { USDC: 50, USDP: 25, DAI: 25 };
}

function quoteRun(employees: Employee[], token: string): PayrollRunQuote {
  const totalUSD = employees.reduce((s, e) => s + e.salaryUSD, 0);
  const tokenPrice = tokenPrices[token] ?? 1;
  const slippagePct = 0.003; // 0.3%
  const gasUSD = Math.max(1, employees.length * 0.03); // L2 gas estimate
  const feesUSD = Math.max(2, totalUSD * 0.002); // 0.2% routing fee
  const tokenAmount = (totalUSD + gasUSD + feesUSD) / tokenPrice * (1 + slippagePct);
  return {
    totalUSD,
    token,
    tokenPrice,
    tokenAmount,
    gasUSD,
    feesUSD,
    slippagePct,
    stableBasket: buildStableBasket(),
  };
}

export default function PayrollApp() {
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees);
  const [selectedToken, setSelectedToken] = useState<string>("ETH");
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<string>(employees[0]?.id ?? "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newEmp, setNewEmp] = useState<Employee>({
    id: "",
    name: "",
    wallet: "",
    verified: false,
    salaryUSD: 2800,
    split: { stable: 70, offramp: 20, btc: 10 },
    stablecoin: "USDC",
    jurisdiction: "IN",
  });
  const [sponsorGas, setSponsorGas] = useState(true);

  const quote = useMemo(() => quoteRun(employees, selectedToken), [employees, selectedToken]);

  function addEmployee() {
    if (!newEmp.name || !isEthAddress(newEmp.wallet)) return alert("Enter name and a valid 0x wallet address.");
    const id = "e" + (Math.random() * 1e6).toFixed(0);
    setEmployees((prev) => [...prev, { ...newEmp, id }]);
    setNewEmp({ ...newEmp, id: "", name: "", wallet: "" });
  }

  function toggleVerify(id: string) {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, verified: !e.verified } : e)));
  }

  function executeRun() {
    const id = "run_" + (Math.random() * 1e6).toFixed(0);
    const receipts: PayoutReceipt[] = employees.map((e) => ({ employeeId: e.id, txHash: randomHex(), status: "confirmed" }));
    const run: PayrollRun = { id, createdAt: Date.now(), token: selectedToken, quote, receipts, status: "executed" };
    setRuns((r) => [run, ...r]);
  }

  // Forecast data for the AI budget copilot (mock)
  const forecastData = useMemo(() => {
    const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"]; // 6 months
    const base = employees.reduce((s, e) => s + e.salaryUSD, 0);
    return months.map((m, i) => ({
      month: m,
      payroll: Math.round((base * (1 + 0.005 * i)) * 100) / 100,
      risk: Math.round((Math.sin(i / 2) * 2 + 5) * 10) / 10, // pseudo risk score
    }));
  }, [employees]);

  const selectedEmployee = employees.find((e) => e.id === selectedEmp) ?? employees[0];

  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="dashboard" className="min-h-screen">
        {/* Unified Header with Integrated Navigation */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg shadow-sm">
                <DollarSign className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm leading-none">Crypto Payroll</span>
                <span className="text-[10px] text-muted-foreground">Enterprise Platform</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center flex-1 justify-center">
              <TabsList className="grid w-auto grid-cols-6 bg-muted/50 p-1 h-9 rounded-lg border shadow-sm">
                <TabsTrigger 
                  value="dashboard" 
                  className="text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md"
                >
                  Dashboard
                </TabsTrigger>
                <TabsTrigger 
                  value="admin" 
                  className="text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md"
                >
                  Admin
                </TabsTrigger>
                <TabsTrigger 
                  value="employee" 
                  className="text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md"
                >
                  Employee
                </TabsTrigger>
                <TabsTrigger 
                  value="copilot" 
                  className="text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md"
                >
                  AI Copilot
                </TabsTrigger>
                <TabsTrigger 
                  value="compliance" 
                  className="text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md"
                >
                  Compliance
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md"
                >
                  Settings
                </TabsTrigger>
              </TabsList>
            </nav>

            {/* Actions - Right Side */}
            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
              
              {/* Mobile Actions - Theme Toggle + Menu */}
              <div className="md:hidden flex items-center gap-1">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-background">
              <div className="container py-4">
                <TabsList className="grid w-full grid-cols-1 gap-2 h-auto bg-transparent p-0">
                  <TabsTrigger 
                    value="dashboard" 
                    className="justify-start h-10 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger 
                    value="admin" 
                    className="justify-start h-10 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </TabsTrigger>
                  <TabsTrigger 
                    value="employee" 
                    className="justify-start h-10 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Employee
                  </TabsTrigger>
                  <TabsTrigger 
                    value="copilot" 
                    className="justify-start h-10 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    AI Copilot
                  </TabsTrigger>
                  <TabsTrigger 
                    value="compliance" 
                    className="justify-start h-10 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Compliance
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings" 
                    className="justify-start h-10 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Settings
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          )}
        </header>

        <main className="mx-auto max-w-7xl p-4 md:p-6">

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard title="Monthly Payroll" value={fmtUSD(employees.reduce((s,e)=>s+e.salaryUSD,0))} icon={<Banknote className="h-5 w-5" />} sub="Projected this month" />
              <StatCard title="Headcount" value={String(employees.length)} icon={<Users className="h-5 w-5" />} sub="Active payees" />
              <StatCard title="Funding Token" value={selectedToken} icon={<ArrowRightLeft className="h-5 w-5" />} sub={`1 ${selectedToken} = ${fmtUSD(tokenPrices[selectedToken])}`} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5"/> Runway & Burn Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="payroll" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5"/> Volatility Shield</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Recommendation: Convert <b>65%</b> of funding to stablecoins now, hedge <b>35%</b> for 30 days.</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge>Stable Basket: 50% USDC</Badge>
                    <Badge variant="secondary">25% USDP</Badge>
                    <Badge variant="secondary">25% DAI</Badge>
                  </div>
                  <Button className="mt-2 w-full" variant="default">Apply Policy</Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5"/> Recent Payroll Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <RunsTable runs={runs} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin */}
          <TabsContent value="admin" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ArrowRightLeft className="h-5 w-5"/> Funding</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Label className="text-xs">Funding Token</Label>
                  <Select value={selectedToken} onValueChange={setSelectedToken}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(tokenPrices).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-muted-foreground">1 {selectedToken} ≈ {fmtUSD(tokenPrices[selectedToken])}</div>
                  <div className="rounded-md bg-muted p-2 text-xs border">Stablecoin policy: 50% USDC / 25% USDP / 25% DAI</div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/> Employees</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Wallet</TableHead>
                        <TableHead className="text-right">Salary</TableHead>
                        <TableHead className="text-center">Verified</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>{e.name}</TableCell>
                          <TableCell className="font-mono text-xs">{e.wallet.slice(0,10)}…{e.wallet.slice(-6)}</TableCell>
                          <TableCell className="text-right">{fmtUSD(e.salaryUSD)}</TableCell>
                          <TableCell className="text-center">
                            <Button size="sm" variant={e.verified?"secondary":"outline"} onClick={()=>toggleVerify(e.id)}>
                              {e.verified ? "Verified" : "Verify"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                    <div className="md:col-span-2">
                      <Label>Name</Label>
                      <Input value={newEmp.name} onChange={(e)=>setNewEmp({...newEmp, name:e.target.value})} placeholder="Full name" />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Wallet (0x…)</Label>
                      <Input value={newEmp.wallet} onChange={(e)=>setNewEmp({...newEmp, wallet:e.target.value})} placeholder="0x…" />
                    </div>
                    <div>
                      <Label>Salary (USD)</Label>
                      <Input type="number" value={newEmp.salaryUSD} onChange={(e)=>setNewEmp({...newEmp, salaryUSD: Number(e.target.value)})} />
                    </div>
                    <div>
                      <Label>Stablecoin</Label>
                      <Select value={newEmp.stablecoin} onValueChange={(value: Stablecoin)=>setNewEmp({...newEmp, stablecoin:value})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {stablecoins.map(coin => <SelectItem key={coin} value={coin}>{coin}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-6 flex justify-end">
                      <Button onClick={addEmployee}>Add Employee</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Quote this Payroll Run</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-lg bg-muted p-3 border">
                      <div className="text-muted-foreground">Total Salaries</div>
                      <div className="text-2xl font-semibold">{fmtUSD(quote.totalUSD)}</div>
                    </div>
                    <div className="rounded-lg bg-muted p-3 border">
                      <div className="text-muted-foreground">Estimated Gas</div>
                      <div className="text-2xl font-semibold">{fmtUSD(quote.gasUSD)}</div>
                    </div>
                    <div className="rounded-lg bg-muted p-3 border">
                      <div className="text-muted-foreground">Fees</div>
                      <div className="text-2xl font-semibold">{fmtUSD(quote.feesUSD)}</div>
                    </div>
                    <div className="rounded-lg bg-muted p-3 border">
                      <div className="text-muted-foreground">You need</div>
                      <div className="text-2xl font-semibold">{fmt(quote.tokenAmount)} {quote.token}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Switch checked={sponsorGas} onCheckedChange={setSponsorGas} />
                      <span>Sponsor employee gas with Paymaster</span>
                    </div>
                    <Button onClick={executeRun} className="gap-2"><Send className="h-4 w-4"/> Execute Run</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stablecoin Basket</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {Object.entries(quote.stableBasket).map(([sc, pct]) => (
                    <div key={sc} className="flex items-center justify-between">
                      <span>{sc}</span>
                      <Badge variant="secondary">{pct}%</Badge>
                    </div>
                  ))}
                  <div className="text-xs text-muted-foreground">(Mock allocation – in a real app this is AI-optimized and changeable.)</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Employee Portal */}
          <TabsContent value="employee" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5"/> Select Employee</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={selectedEmployee?.id} onValueChange={setSelectedEmp}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <div className="rounded-md border p-3 text-sm space-y-1">
                    <div className="flex justify-between"><span>Name</span><b>{selectedEmployee?.name}</b></div>
                    <div className="flex justify-between"><span>Wallet</span><span className="font-mono text-[11px]">{selectedEmployee?.wallet.slice(0,10)}…{selectedEmployee?.wallet.slice(-6)}</span></div>
                    <div className="flex justify-between"><span>Split</span><span>{selectedEmployee?.split.stable}% Stable · {selectedEmployee?.split.offramp}% Off-ramp · {selectedEmployee?.split.btc}% BTC</span></div>
                    <div className="flex justify-between"><span>Jurisdiction</span><span>{selectedEmployee?.jurisdiction}</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Payout & Withdraw</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted p-3 border">
                      <div className="text-muted-foreground">This Month Earned</div>
                      <div className="text-2xl font-semibold">{fmtUSD(selectedEmployee?.salaryUSD ?? 0)}</div>
                    </div>
                    <div className="rounded-lg bg-muted p-3 border">
                      <div className="text-muted-foreground">Stablecoin</div>
                      <div className="text-2xl font-semibold">{Math.round(((selectedEmployee?.salaryUSD ?? 0) * (selectedEmployee?.split.stable ?? 0) / 100)*100)/100} {selectedEmployee?.stablecoin}</div>
                    </div>
                    <div className="rounded-lg bg-muted p-3 border">
                      <div className="text-muted-foreground">Off-ramp (est.)</div>
                      <div className="text-2xl font-semibold">{fmtUSD(((selectedEmployee?.salaryUSD ?? 0) * (selectedEmployee?.split.offramp ?? 0) / 100) * 0.995)}</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <Button variant="default" className="gap-2"><ArrowRightLeft className="h-4 w-4"/> Convert & Withdraw</Button>
                    <Button variant="secondary" className="gap-2"><Send className="h-4 w-4"/> View Payslip</Button>
                  </div>

                  <div className="text-xs text-muted-foreground">This is a fully local demo: actions simulate the UX without broadcasting transactions.</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Copilot */}
          <TabsContent value="copilot" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5"/> Budget Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="payroll" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm space-y-1">
                  <p>• Suggested conversion now: <b>65%</b> → stabilize exposure.</p>
                  <p>• Hedge: <b>35%</b> for 30 days (perps/options) to cap variance.</p>
                  <p>• Basket: <b>50% USDC / 25% USDP / 25% DAI</b> to diversify issuer risk.</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button>Apply to Next Run</Button>
                  <Button variant="secondary">Export Policy JSON</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance */}
          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5"/> Compliance Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Flag</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.filter(e=>/dead/i.test(e.wallet)).map((e)=> (
                      <TableRow key={e.id}>
                        <TableCell>{e.name}</TableCell>
                        <TableCell className="font-mono text-xs">{e.wallet.slice(0,10)}…{e.wallet.slice(-6)}</TableCell>
                        <TableCell><Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3"/> Known vanity prefix</Badge></TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline">Override Approve</Button>
                          <Button size="sm" variant="secondary">Request New Address</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {employees.filter(e=>/dead/i.test(e.wallet)).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">No flags right now.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5"/> Platform Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <Label>Default Network</Label>
                    <Select defaultValue="Base">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Base">Base</SelectItem>
                        <SelectItem value="Arbitrum">Arbitrum</SelectItem>
                        <SelectItem value="Optimism">Optimism</SelectItem>
                        <SelectItem value="Polygon">Polygon</SelectItem>
                        <SelectItem value="Avalanche">Avalanche (Fuji Testnet)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Max Auto-Approval (USD)</Label>
                    <Input defaultValue={500} type="number" />
                  </div>
                  <div>
                    <Label>Travel-Rule Provider</Label>
                    <Select defaultValue="MockTRP">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MockTRP">MockTRP</SelectItem>
                        <SelectItem value="TRP-X">TRP-X</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Webhook URL</Label>
                  <Input placeholder="https://yourapp.com/webhooks/payroll" />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea placeholder="Any internal notes…" />
                </div>
                <Button className="mt-2">Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </main>

        <footer className="mt-10 border-t">
          <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground flex items-center justify-between">
            <span>© {new Date().getFullYear()} Crypto Payroll Platform</span>
            <span>All on-chain actions are simulated for demo purposes.</span>
          </div>
        </footer>
      </Tabs>
    </div>
  );
}

function RunsTable({ runs }: { runs: PayrollRun[] }) {
  if (!runs.length) return <div className="text-sm text-muted-foreground">No runs yet. Execute one from the Admin tab.</div>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Run ID</TableHead>
          <TableHead>When</TableHead>
          <TableHead>Token</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Total USD</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map((r)=> (
          <TableRow key={r.id}>
            <TableCell className="font-mono text-xs">{r.id}</TableCell>
            <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
            <TableCell>{r.token}</TableCell>
            <TableCell className="text-right">{fmt(r.quote.tokenAmount)} {r.token}</TableCell>
            <TableCell className="text-right">{fmtUSD(r.quote.totalUSD)}</TableCell>
            <TableCell>
              <Badge className="gap-1" variant="secondary"><CheckCircle2 className="h-3 w-3"/> {r.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function StatCard({ title, value, sub, icon }: { title: string; value: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}
