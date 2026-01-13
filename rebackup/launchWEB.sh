cd ./docker && npm install
cd ../vsftpd && npm install 
npx concurrently "cd ../docker && npm run dev -- --host --port 3001" "cd ../vsftpd && npm run dev -- --host --port 3002"
