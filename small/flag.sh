#!/bin/bash

# ==============================================================================
#  Host-to-Container Setup Script
# ==============================================================================
# This script connects to a running Docker container to execute setup logic.
#
# Usage:
# 1. Save this file (e.g., as 'setup.sh').
# 2. Make it executable: chmod +x setup.sh
# 3. Run it: ./setup.sh
# ==============================================================================

# --- Configuration ---
# The name of your running Docker container.
CONTAINER_NAME="badweb"

# --- Pre-flight Check ---
# 1. Check if Docker is installed.
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker to continue."
    exit 1
fi

# 2. Check if the target container is running.
if ! docker ps -f name="^/${CONTAINER_NAME}$" --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: Container '${CONTAINER_NAME}' is not running."
    exit 1
fi

# --- Execution ---
# Use 'docker exec' to run the setup script inside the container.
# The 'heredoc' (<< 'EOF') passes the script into the container.
docker exec -i -u root "${CONTAINER_NAME}" bash << 'EOF'

# ==============================================================================
#  (This part of the script runs INSIDE the container)
#  System Configuration Script
# ==============================================================================

# --- Prerequisite Check ---
if ! command -v useradd &> /dev/null; then
    if command -v apt-get &> /dev/null; then
        apt-get update > /dev/null && apt-get install -y passwd > /dev/null
    elif command -v apk &> /dev/null; then
        apk add --no-cache shadow > /dev/null
    else
        echo "Error: Unsupported package manager. Please install 'useradd' manually." >&2
        exit 1
    fi

    if ! command -v useradd &> /dev/null; then
        echo "Error: Failed to install 'useradd'." >&2
        exit 1
    fi
fi

# --- Configuration ---
FLAG_CONTENT="CTF{d1g1t4l_d3p0s1t_b0x_k3y}"
ALL_USERS=(
    "machiavelli" "socrates" "plato" "aristotle" "descartes" "kant" 
    "nietzsche" "locke" "hume" "spinoza" "kierkegaard" "sartre" 
    "camus" "foucault" "derrida" "heidegger" "wittgenstein" "russell" 
    "aquinas" "aurelius" "seneca" "epicurus" "zizek" "rand" 
    "popper" "rawls" "nozick" "habermas" "adorno" "sun-tzu" "chomsky"
)

# --- Logic ---
USER_COUNT=${#ALL_USERS[@]}
RANDOM_INDEX=$((RANDOM % USER_COUNT))
FLAG_BEARER=${ALL_USERS[$RANDOM_INDEX]}

NOUNS=("Report" "Statement" "Analysis" "Memo" "Summary" "Ledger" "Invoice" "Draft" "Data" "Forecast")
QUARTERS=("Q1" "Q2" "Q3" "Q4")
YEARS=("2022" "2023" "2024")
EXTENSIONS=(".docx" ".xlsx" ".pdf" ".txt" ".csv")

for USERNAME in "${ALL_USERS[@]}"; do
    # Create the user if they don't exist
    if ! id -u "$USERNAME" >/dev/null 2>&1; then
        useradd -m "$USERNAME"
        if [ $? -ne 0 ]; then
            echo "Warning: Could not create user $USERNAME. Skipping." >&2
            continue
        fi
    fi

    # Create directories
    DOCS_PATH="/home/$USERNAME/Documents"
    mkdir -p "$DOCS_PATH"
    
    # Place primary file for the selected user
    if [ "$USERNAME" == "$FLAG_BEARER" ]; then
        FLAG_FILE_PATH="$DOCS_PATH/.credenti@ls"
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

    see what is at http://127.0.0.1:8088/docker.html

====================================================================
ART_EOF
    fi

    # Place secondary file for a specific user
    if [ "$USERNAME" == "socrates" ]; then
        RED_HERRING_PATH="$DOCS_PATH/bank.txt"
        echo "this is only an example, maybe someone else has the right file" > "$RED_HERRING_PATH"
    fi

    # Create dummy files for all users
    NUM_RUBBISH_FILES=$(( (RANDOM % 26) + 15 ))
    for j in $(seq 1 $NUM_RUBBISH_FILES); do
        RANDOM_NOUN=${NOUNS[$RANDOM % ${#NOUNS[@]}]}
        RANDOM_QUARTER=${QUARTERS[$RANDOM % ${#QUARTERS[@]}]}
        RANDOM_YEAR=${YEARS[$RANDOM % ${#YEARS[@]}]}
        RANDOM_EXT=${EXTENSIONS[$RANDOM % ${#EXTENSIONS[@]}]}
        FILENAME="${RANDOM_NOUN}_${RANDOM_QUARTER}_${RANDOM_YEAR}_${j}${RANDOM_EXT}"
        FILEPATH="$DOCS_PATH/$FILENAME"
        
        echo "This is a standard corporate document." > "$FILEPATH"
        echo "Reference ID: $(cat /dev/urandom | tr -dc 'A-Z0-9' | head -c 12)" >> "$FILEPATH"
        echo "" >> "$FILEPATH"

        NUM_JUNK_LINES=$(( (RANDOM % 20) + 5 ))
        for k in $(seq 1 $NUM_JUNK_LINES); do
            JUNK_LINE=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9 .,' | head -c $(( (RANDOM % 70) + 10 )))
            echo "$JUNK_LINE" >> "$FILEPATH"
        done
    done
    
    # Set correct ownership
    chown -R $USERNAME:$USERNAME "/home/$USERNAME"
done

EOF

# --- Final Status ---
# Check the exit code of the last command (docker exec)
if [ $? -eq 0 ]; then
    echo "Setup complete."
else
    echo "Setup failed."
fi
