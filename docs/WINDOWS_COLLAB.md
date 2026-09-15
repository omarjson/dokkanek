# Dokkanek for Windows — Shared Collaboration Contract

> **For both AI agents (local + cloud) and any human reviewer.**
> Web app in repo root is **REFERENCE ONLY — DO NOT MODIFY** for this track.
> Windows app lives in `windows/`. CI builds it. Nothing is pushed to GitHub
> until the full scope is done, reviewed, and verified locally.
> Language of this doc and all code comments: **English**.
> User-facing strings: **Arabic (RTL)**.

## 1. Goal and Principles

1. Native Windows app, Win7 SP1 → Win11, one installer.
2. Offline-first. SQLite single file. No server required.
3. Lightweight and fast: cold start < 2s on HDD, idle RAM < 150MB.
4. Honest pricing artifact: Terms + Privacy screens are mandatory, acceptance
   timestamp stored in DB.
5. Automatic backup to local folder + USB flash, one-click restore on a new PC.
6. Clean, reviewed code over speed of delivery. No shortcuts in money/stock paths.

## 2. Locked Decisions (2026-09-12)

| Decision | Value | Why |
|---|---|---|
| UI stack | WPF + .NET Framework 4.8, C# 7.3, XAML | Only stack covering Win7→Win11 + mature thermal printing |
| Data | SQLite via `System.Data.SQLite` (x86+x64), ADO.NET, no EF | EF6 on net48 is heavy and slow on old hardware; hand-rolled repositories are inspectable |
| MVVM | `CommunityToolkit.Mvvm 8.2.2` + `Microsoft.Extensions.Hosting 6.0` DI | Standard, testable, no code-behind business logic |
| Installer | Inno Setup 6 (`windows/installer/setup.iss`) | Terms/Privacy pages, USB-driver friendly, works on Win7 |
| Updater | Velopack (`Velopack 0.0.x`) from GitHub Releases, delta | Silent background updates, no admin required after install |
| Scope V1 | FULL parity with web (all modules) | User decision; delivered in P0→P3 slices internally |
| Backup targets | Local folder + USB flash | User decision; network/cloud deferred |
| Branching | `main` frozen; work on `windows/<module>-<short>`; PR + second-agent review | Two agents must never edit the same file concurrently |

## 3. Source Map (Web → Windows)

| Web reference | Windows equivalent | Notes |
|---|---|---|
| `prisma/schema.prisma` (28 models) | `windows/src/Dokkanek.Desktop/Domain/Entities/*.cs` | `Float→decimal` for money, `cuid→Guid N`, enums stay `string` constants |
| `prisma/seed.mjs` | `Data/Seed.cs` | admin/admin123, cashier/courier/tech/1234, Tripoli/Benghazi branches |
| `lib/sales.ts:createSale` | `Services/SaleService.cs:CreateSale` | MUST keep exact rules/messages; wrap in single SQLite transaction |
| `app/api/sales/[id]/route.ts` void | `SaleService.VoidSale` | Requires `sales.void`; restores stock + `StockMove IN` |
| `app/api/payments/route.ts` | `PaymentService.cs` | `amount<=total-paid` guard |
| `app/api/returns/route.ts` | `ReturnService.cs` | damage decrements, return increments |
| `app/api/purchases/route.ts` | `PurchaseService.cs` | weighted-average costPrice, 2dp |
| `app/api/stocktake/*` | `StocktakeService.cs` | open/add/close with `stocktake.adjust` gate |
| `app/api/transfers/route.ts` | `TransferService.cs` | two `StockMove TRANSFER` rows, same `ref TRF-xxx` |
| `app/api/shifts/route.ts` | `ShiftService.cs` | single OPEN shift; expected=cash payments since open |
| `lib/permissions.ts` | `Services/PermissionService.cs` + `Domain/Permissions.cs` | `ADMIN:[*]`, MANAGER defaults, `perm_{ROLE}_{key}` overrides in Settings |
| `lib/modules.ts` | `Services/ModuleService.cs` + `Domain/StoreModules.cs` | 13 keys, `mod_{key}=0` off, grocery/clothing presets |
| `lib/auth.ts` + `app/api/auth/route.ts` | `Services/AuthService.cs` | `SHA256("dokkanek:"+pwd)` compat; new hashes PBKDF2; 5 fails/5min persisted lockout |
| `lib/audit.ts` | `Services/AuditService.cs` | fire-and-forget, never breaks main op |
| `lib/notify.ts` | `Services/NotificationService.cs` | PENDING queue + background retry worker |
| `lib/format.ts` | `Services/Formatting.cs` | `lyd()`, Arabic date, status/method dictionaries |
| `middleware.ts` | `UI/Navigation/RequireAuth` + login redirect | no cookies; local session store |
| `components/ui.tsx` | `UI/Styles/*` (Card, PageTitle, Stat, Badge, Tables, Buttons) | brand color from Settings |
| `components/Sidebar.tsx` sections | `UI/MainWindow.xaml` nav groups: Work/Inventory/Field/Admin | filtered by role/perm/module |
| `app/pos/POSClient.tsx` outbox | `Services/SyncOutbox` (local pending-sales table) | offline queue; survives restart (NOT localStorage) |
| `app/setup/*` wizard | `UI/Views/Setup/*` + Terms/Privacy pages | stores acceptance UTC in Settings |

## 4. Repository Layout (authoritative)

```text
windows/
  Dokkanek.Windows.sln
  src/Dokkanek.Desktop/
    Dokkanek.Desktop.csproj        # net48, WPF, single exe
    App.xaml / App.xaml.cs         # Host bootstrap, DI, theme, session
    app.manifest                   # Win7 compat + DPI aware
    Domain/
      Entities/                    # 28 POCOs, DataAnnotations, no logic
      Constants.cs                 # Roles, SaleStatus, PayMethods, Perms, Modules
    Data/
      Db.cs                        # connection + schema create + migrations
      Repositories/                # one repo per aggregate, parameterized SQL only
      Seed.cs
    Services/
      Interfaces/                  # ISaleService, IAuthService, ... (UI depends ONLY on these)
      *.cs                         # Sale, Purchase, Payment, Return, Stocktake,
                                   # Transfer, Shift, Product, Customer, Supplier,
                                   # Expense, Employee, Maintenance, Delivery,
                                   # Auth, Permissions, Modules, Settings,
                                   # Audit, Notifications, Backup, Update, Print, Formatting
    UI/
      MainWindow.xaml(.cs)         # shell + nav, no business logic
      Views/                       # one folder per module, View+XAML+ViewModel
      Styles/                      # colors, Card, buttons, tables (mirrors ui.tsx)
      Navigation/
    Assets/Terms.rtf, Privacy.rtf
  tests/Dokkanek.Tests/
    Dokkanek.Tests.csproj          # net48, MSTest
    SaleServiceTests.cs ...        # transaction/void/payment/stocktake tests
  installer/setup.iss
.github/workflows/windows-build.yml
docs/WINDOWS_COLLAB.md             # this file
```

Rules:

* UI projects reference ONLY `Services/Interfaces`. No `System.Data.SQLite`
  outside `Data/`. No SQL strings outside `Data/Repositories`.
* Every money/stock mutation: open connection → `BEGIN IMMEDIATE` →
  guards → writes → `COMMIT`; on error `ROLLBACK` + Arabic exception message
  identical to web (`السلة فارغة`, `الكمية غير كافية: {name}`, ...).
* All SQL parameterized. String-concatenated SQL = reject in review.
* No `async void` except event handlers. No business logic in code-behind.
* C# 7.3 max (net48 compiler). No file-scoped namespaces, no records,
  no range syntax. Nullable reference types OFF (net48 friction).

## 5. Two-Agent Protocol

* Claim a module by adding a row to §8 Progress Log BEFORE editing.
* One branch per task: `windows/<module>-<short>` (e.g. `windows/pos-outbox`).
* Never edit a file another agent has claimed without comment handoff.
* Every PR: what changed, which web rules preserved, how verified, screenshots
  for UI.
* Reviewer checklist: transaction? permission gate? audit row? parameterized?
  Arabic message parity? test added? doc row added?
* Conflicts: newest decision wins, old text moved to §9 ADR with reason + date.

## 6. Definition of Done (per module)

- [ ] Builds with `msbuild windows/Dokkanek.Windows.sln /p:Configuration=Release`
- [ ] Works offline with zero network (unplug test)
- [ ] Money/stock path covered by at least one automated test
- [ ] Permission + module gates enforced (hidden nav AND blocked service call)
- [ ] AuditLog row written on create/void/close/transfer
- [ ] Arabic messages match web reference
- [ ] Backup includes new tables (no new file outside `dokkanek.db`)
- [ ] Progress log updated

## 7. Build, Test, Package (no push until green)

Local (VS Build Tools or VS2022):

```bat
msbuild windows\Dokkanek.Windows.sln /p:Configuration=Release
vstest.console windows\tests\Dokkanek.Tests\bin\Release\Dokkanek.Tests.dll
iscc windows\installer\setup.iss
```

CI (`.github/workflows/windows-build.yml`, `windows-latest`):
restore → build → test → publish portable zip → Inno installer →
upload artifacts → Velopack release (only on tag `windows-v*`).
Local agent MUST NOT run `git push` or `gh release` (user instruction).

## 8. Progress Log

| Date (UTC) | Agent | Task | Status | Notes |
|---|---|---|---|---|
| 2026-09-12 | local | scaffold + contract | in-progress | P0 started, no push |
| 2026-09-12 | local (4 parallel builders) | full tree: Domain 28 entities, Data, 24 Services + 26 interfaces, 30 Views, installer, CI, tests | done-static-check | 181 files; 36 XAML valid, 139 CS braces balanced; no compiler on machine |
| 2026-09-12 | local (review) | net48 compat fixes: System.Data.SQLite.Core 1.0.118, Hosting 6.0.1, VOID→CANCELLED, Adapters bridge | done | web tree untouched (0 tracked modifications), no push |
| 2026-09-12 | local | review fixes B1–B9: guarded decrement, warehouse-only transfer, frozen stocktake baseline, increment close + MarkClosed/ClosedAt, single-statement purchase + AwayFromZero, shift default-to-expected + guarded Close, void audit parity, busy_timeout | done-static-check | no compiler on machine; full msbuild run is CI/first-review-machine task |

## 9. ADR (Architecture Decision Records)

* ADR-001 (2026-09-12): WPF net48 over Avalonia — Win7 + thermal printing guarantee.
* ADR-002 (2026-09-12): ADO.NET + System.Data.SQLite over EF6 — inspectable SQL, fast on HDD, no migration black box; schema version in `Settings(schema_version)`.
* ADR-003 (2026-09-12): Velopack over Squirrel/MSIX — Win7 support + delta from GitHub Releases.
* ADR-004 (2026-09-12): Full parity V1 — user decision; risk accepted (longer timeline), mitigated by P0→P3 slices.
* ADR-005 (2026-09-12): System.Data.SQLite.Core 1.0.118 over Microsoft.Data.Sqlite 8 — the latter needs .NET 6+ and breaks net48/Win7. Hosting pinned to 6.0.x LTS for the same reason.
* ADR-006 (2026-09-12): Row DTO contracts (double, mirrors Prisma Float) are canonical for Services; Domain entities (decimal) are canonical for storage; `Data/Repositories/Adapters.cs` bridges them. P1 wiring: thin wrappers implementing `I*Repository` over the concrete SQLite repos.
* ADR-007 (2026-09-12): `SqliteUnitOfWork` is a logical grouping only — each Row repo opens its own connection, so multi-write flows are NOT atomically transactional yet (same as web, which has no `$transaction`). Mitigations applied instead: atomic guarded stock writes (`DecrementStockGuarded`, `AddStockWithCost`), warehouse-only transfer updates, increment-based stocktake close, frozen stocktake baselines, `busy_timeout=5000`. Full shared-connection UoW is P1 backlog.
* ADR-008 (2026-09-12): intentional Arabic message deviations from web (web mixes English): `توجد وردية مفتوحة` (web: `... already`), `الفاتورة ملغاة مسبقا` (web: `ملغاة already`), `إلغاء الفواتير يحتاج صلاحية` (web: `الإلغاء يحتاج صلاحية`), `الجرد مقفل` (web: `الجرد مقفل already`). Void audit is `UPDATE/Sale` with value in details, matching web.

## 10. Backup/Restore Contract

* DB file: `%ProgramData%\Dokkanek\dokkanek.db` (fallback `%LOCALAPPDATA%`).
* Copy targets: `%ProgramData%\Dokkanek\Backups\` + each removable USB
  `:\DokkanekBackups\` (auto-detect insert via WMI).
* Triggers: app close + hourly timer + manual button.
* Format: `dokkanek_YYYY-MM-DD_HHmm.db.gz` + `.sha256`; rotation 7 daily / 4 weekly.
* Restore wizard validates gzip + hash + `PRAGMA integrity_check` before swap;
  keeps `.pre-restore` copy. Restore must never delete newest valid copy.
