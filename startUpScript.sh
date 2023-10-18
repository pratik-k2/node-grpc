export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

# Node installation
if [ -z "$NODE_VERSION" ]
then
    echo "Node version is not set, switching to default version 18.16.1"
    nvm install 18.16.1
    npm install --save
else
    nvm install $NODE_VERSION
    npm install --save
fi

# Config file mounting
cp $NEW_RELIC_SECURITY_CONFIG_PATH /node_grpc/

# Agent installation
if [ -z "$APM_BRANCH" ]
then
    echo "APM_BRANCH is not set, installing ${APM_VERSION} APM agent"
    npm install newrelic@${APM_VERSION}
else
    echo "https://github.com/newrelic/node-newrelic.git/#${APM_BRANCH}"
    npm install "https://github.com/newrelic/node-newrelic.git/#${APM_BRANCH}"
fi

if [ -z "$CSEC_BRANCH" ]
then
    echo "CSEC_BRANCH is not set"
else
    rm -rf node_modules/\@newrelic/security-agent
    echo "https://github.com/newrelic/csec-node-agent.git/#${CSEC_BRANCH}"
    npm install "https://github.com/newrelic/csec-node-agent.git/#${CSEC_BRANCH}"
    rm -rf node_modules/newrelic/node_modules/@newrelic/security-agent
fi

# start Ldap Server
node index.js & 
# start NodeJS application
node $NR_OPTS server.js