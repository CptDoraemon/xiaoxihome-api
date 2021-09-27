aws ecr get-login-password | docker login --password-stdin -u AWS 298551144282.dkr.ecr.ca-central-1.amazonaws.com/xiaoxihome-api &&
docker build -t xiaoxihome-api . &&
docker tag xiaoxihome-api:latest 298551144282.dkr.ecr.ca-central-1.amazonaws.com/xiaoxihome-api:latest &&
docker push 298551144282.dkr.ecr.ca-central-1.amazonaws.com/xiaoxihome-api:latest
