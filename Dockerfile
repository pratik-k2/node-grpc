FROM ubuntu:22.04

ENV DEBIAN_FRONTEND="noninteractive"

RUN apt-get update \
  && apt install -y wget curl iputils-ping vim lsb-release python3-pip build-essential gcc-multilib g++-multilib \
  && pip3 install python-gnupg 

# Install latest Mysql
# RUN apt-get -y install mysql-server

# Application mounting & permissions
COPY node_grpc/ /node_grpc/
COPY startUpScript.sh /node_grpc/
COPY node_grpc/attack.sh /

WORKDIR /node_grpc/

ENV NVM_DIR /root/.nvm
# Install NVM(Node)
RUN curl -LsS https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash \
  && . $NVM_DIR/nvm.sh \
  && apt update \
  && apt-get install -y git 

RUN chmod 777 /node_grpc/startUpScript.sh
RUN chmod 777 /node_grpc/attack.sh

ENV NEW_RELIC_SECURITY_CONFIG_PATH=""
ENV NR_OPTS=""
ENV APM_BRANCH=""
ENV CSEC_BRANCH=""
ENV NODE_VERSION=""
ENV APM_VERSION="latest"

CMD ["/bin/bash","-c","/node_grpc/startUpScript.sh && tail -f /dev/null"]