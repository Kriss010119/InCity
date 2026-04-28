FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY DomainLib/DomainLib.csproj DomainLib/
COPY RoutePlanning/RoutePlanning.csproj RoutePlanning/
COPY MidLayer/MidLayer.csproj MidLayer/
COPY TopLayer/TopLayer.csproj TopLayer/
RUN dotnet restore TopLayer/TopLayer.csproj

COPY . .
RUN dotnet publish TopLayer/TopLayer.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app .

RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client && \
    rm -rf /var/lib/apt/lists/*

COPY db/load-seed.sh /usr/local/bin/load-seed.sh
RUN chmod +x /usr/local/bin/load-seed.sh

COPY db/init/02_seed.sql /seed/02_seed.sql

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000

ENTRYPOINT ["/usr/local/bin/load-seed.sh", "dotnet", "TopLayer.dll"]