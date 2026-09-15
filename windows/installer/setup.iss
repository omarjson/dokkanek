; Dokkanek Inno Setup 6 script
#define MyAppName "Dokkanek"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Dokkanek"
#define MyAppExeName "Dokkanek.Desktop.exe"

[Setup]
AppId={{8A4B2C10-DOKK-4ANE-KDES-KTOP1000}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
LicenseFile=..\src\Dokkanek.Desktop\Assets\Terms.rtf
InfoBeforeFile=..\src\Dokkanek.Desktop\Assets\Privacy.rtf
OutputBaseFilename=Dokkanek-Setup-{#MyAppVersion}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=admin

[Languages]
Name: "arabic"; MessagesFile: "compiler:Languages\Arabic.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "..\src\Dokkanek.Desktop\bin\Release\net48\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs
; Data lives in ProgramData (never wiped on upgrade)
Source: "..\src\Dokkanek.Desktop\Assets\Terms.rtf"; DestDir: "{app}\Assets"; Flags: ignoreversion skipifsourcedoesntexist

[Dirs]
Name: "{commonappdata}\Dokkanek\Data"; Permissions: everyone-modify
Name: "{commonappdata}\Dokkanek\Backups"; Permissions: everyone-modify

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "تشغيل دكّانك"; Flags: nowait postinstall skipifsilent
