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

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000

ENTRYPOINT ["dotnet", "TopLayer.dll"]