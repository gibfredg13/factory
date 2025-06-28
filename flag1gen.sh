#!/bin/bash

# ==============================================================================
#  Host-to-Container CTF Setup Script
# ==============================================================================
# This script is designed to be run on your HOST machine.
# It will connect to the specified running Docker container and execute the
# setup logic inside it, creating the users and files for the CTF.
#
# Usage:
# 1. Save this file (e.g., as 'run_ctf_setup.sh').
# 2. Make it executable: chmod +x run_ctf_setup.sh
# 3. Run it: ./run_ctf_setup.sh
# ==============================================================================

# --- Configuration ---
# The name of your running Docker container.
CONTAINER_NAME="badweb"

# --- Pre-flight Check ---
# 1. Check if Docker is installed.
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed. Please install Docker to continue."
    exit 1
fi

# 2. Check if the target container is running.
if ! docker ps -f name="^/${CONTAINER_NAME}$" --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "[ERROR] The container '${CONTAINER_NAME}' is not running."
    echo "        Please start the container before running this script (e.g., 'docker start ${CONTAINER_NAME}')."
    exit 1
fi

echo "[INFO] Container '${CONTAINER_NAME}' is running. Proceeding with setup..."
echo "------------------------------------------------------------"

# --- Execution ---
# Use 'docker exec' to run a bash shell as root inside the container.
# The '<< 'EOF'' syntax (a "here document") pipes all the text between
# 'EOF' markers directly into the bash shell as standard input.
# This makes the container execute the script as if you had typed it in manually.
docker exec -i -u root "${CONTAINER_NAME}" /bin/bash << 'EOF'

# ==============================================================================
#  (This part of the script runs INSIDE the container)
#  Bank Server CTF Scenario Script (v1.11 - ASCII Art)
# ==============================================================================

echo "--- Starting CTF Bank Scenario Setup (inside container) ---"

# --- Step 0: Prerequisite Check and Auto-Installation ---
if ! command -v useradd &> /dev/null; then
    echo ""
    echo "[INFO] 'useradd' command not found. Attempting automatic installation..."
    
    if command -v apt-get &> /dev/null; then
        echo "[INFO] Debian/Ubuntu based system detected. Running 'apt-get install -y passwd'..."
        apt-get update > /dev/null && apt-get install -y passwd > /dev/null
    elif command -v apk &> /dev/null; then
        echo "[INFO] Alpine Linux based system detected. Running 'apk add shadow'..."
        apk add --no-cache shadow > /dev/null
    else
        echo "[ERROR] Could not find a supported package manager (apt or apk). Please install 'useradd' manually."
        exit 1
    fi

    if ! command -v useradd &> /dev/null; then
        echo "[ERROR] Installation failed. Could not find 'useradd' after attempting to install."
        exit 1
    else
        echo "[SUCCESS] 'useradd' has been installed successfully."
    fi
    echo ""
fi

# --- Configuration ---
FLAG_CONTENT="CTF{d1g1t4l_d3p0s1t_b0x_k3y}"

# A single list of all users to be created.
ALL_USERS=(
    "machiavelli" "socrates" "plato" "aristotle" "descartes" "kant" 
    "nietzsche" "locke" "hume" "spinoza" "kierkegaard" "sartre" 
    "camus" "foucault" "derrida" "heidegger" "wittgenstein" "russell" 
    "aquinas" "aurelius" "seneca" "epicurus" "zizek" "rand" 
    "popper" "rawls" "nozick" "habermas" "adorno" "sun-tzu" "chomsky"
)

# --- Step 1: Randomly select which user gets the flag ---
USER_COUNT=${#ALL_USERS[@]}
RANDOM_INDEX=$((RANDOM % USER_COUNT))
FLAG_BEARER=${ALL_USERS[$RANDOM_INDEX]}

echo "[*] Total users to create: $USER_COUNT"
echo "[*] The flag will be hidden in the Documents folder of user: '$FLAG_BEARER'"
echo ""

# --- Step 2: Create all users and populate their directories ---
echo "[*] Creating users and populating their home directories with noise..."

NOUNS=("Report" "Statement" "Analysis" "Memo" "Summary" "Ledger" "Invoice" "Draft" "Data" "Forecast")
QUARTERS=("Q1" "Q2" "Q3" "Q4")
YEARS=("2022" "2023" "2024")
EXTENSIONS=(".docx" ".xlsx" ".pdf" ".txt" ".csv")

for USERNAME in "${ALL_USERS[@]}"; do
    echo "    -> Processing user: $USERNAME"

    # Create the user if they don't exist
    if ! id -u "$USERNAME" >/dev/null 2>&1; then
        useradd -m "$USERNAME"
        if [ $? -ne 0 ]; then
            echo "       [WARNING] Could not create user $USERNAME. Skipping."
            continue
        fi
    fi

    # All users get a Documents folder
    DOCS_PATH="/home/$USERNAME/Documents"
    mkdir -p "$DOCS_PATH"
    
    # Check if this is the chosen user to hide the flag
    if [ "$USERNAME" == "$FLAG_BEARER" ]; then
        # The flag is now in a hidden file in plain text with a leetspeak name and ASCII art
        echo "       -> Placing flag in hidden file '.credenti@ls' in this user's Documents folder."
        FLAG_FILE_PATH="$DOCS_PATH/.credenti@ls"
        # Use a "here document" to write the multi-line content to the file.
        # This allows for easy formatting and inclusion of ASCII art.
        cat > "$FLAG_FILE_PATH" << ART_EOF
# User Access Configuration
user_id=$USERNAME
access_key=$FLAG_CONTENT

====================================================================

               .--.
              /.-. '----------.
              \\'-' .--"--""-"-'
               '--'

          Well done, you got it !!!!

Call Axel , Wayne, Gjoko or Stephan to show your L33t
   hacking skills and get put on the board!

====================================================================
ART_EOF
    fi

    # ADDED: Place the red herring file for the user 'socrates'
    if [ "$USERNAME" == "socrates" ]; then
        echo "       -> Placing red herring file 'bank.txt' in this user's Documents folder."
        RED_HERRING_PATH="$DOCS_PATH/bank.txt"
        echo "this is only an example, maybe someone else has the right file" > "$RED_HERRING_PATH"
    fi

    # Each user gets a RANDOM number of rubbish files
    NUM_RUBBISH_FILES=$(( (RANDOM % 26) + 15 )) # Between 15 and 40 files
    echo "       -> Creating $NUM_RUBBISH_FILES rubbish files..."
    for j in $(seq 1 $NUM_RUBBISH_FILES); do
        RANDOM_NOUN=${NOUNS[$RANDOM % ${#NOUNS[@]}]}
        RANDOM_QUARTER=${QUARTERS[$RANDOM % ${#QUARTERS[@]}]}
        RANDOM_YEAR=${YEARS[$RANDOM % ${#YEARS[@]}]}
        RANDOM_EXT=${EXTENSIONS[$RANDOM % ${#EXTENSIONS[@]}]}
        FILENAME="${RANDOM_NOUN}_${RANDOM_QUARTER}_${RANDOM_YEAR}_${j}${RANDOM_EXT}"
        FILEPATH="$DOCS_PATH/$FILENAME"
        
        # Add a standard header
        echo "This is a standard corporate document." > "$FILEPATH"
        echo "Reference ID: $(cat /dev/urandom | tr -dc 'A-Z0-9' | head -c 12)" >> "$FILEPATH"
        echo "" >> "$FILEPATH"

        # Add a random amount of junk text to make file sizes different
        NUM_JUNK_LINES=$(( (RANDOM % 20) + 5 )) # Generate between 5 and 24 lines of text
        for k in $(seq 1 $NUM_JUNK_LINES); do
            JUNK_LINE=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9 .,' | head -c $(( (RANDOM % 70) + 10 )))
            echo "$JUNK_LINE" >> "$FILEPATH"
        done
    done
    
    # Set correct ownership for the entire home directory
    chown -R $USERNAME:$USERNAME "/home/$USERNAME"
done

echo ""
echo "[+] All users and files created successfully."
echo ""
echo "--- Scenario Setup Finished Successfully! ---"

EOF
# --- End of piped script ---

echo "------------------------------------------------------------"
echo "[INFO] Host script finished. The container '${CONTAINER_NAME}' should now be configured."

