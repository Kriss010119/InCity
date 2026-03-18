using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using MidLayer.Contracts;
using MidLayer.DataAccess;
using TopLayer.Services;
using TopLayer.Repositories;

namespace TopLayer
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddScoped<IAttractionRepository, AttractionRepository>();
            builder.Services.AddScoped<IBusRepository, BusRepository>();
            builder.Services.AddScoped<ITramRepository, TramRepository>();
            builder.Services.AddScoped<ITrolleybusRepository, TrolleybusRepository>();
            builder.Services.AddScoped<IMetroRepository, MetroRepository>();
            builder.Services.AddScoped<IArrivalPointRepository, ArrivalPointRepository>();
            builder.Services.AddScoped<DataLoader>();
            builder.Services.AddScoped<RouteService>();

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                {
                    policy.WithOrigins("http://localhost:5173")
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });

            var app = builder.Build();

            app.UseCors("AllowFrontend");

            app.MapGet("/route-from-point", async (double? lat, double? lng, string? duration, string? transport,
                string? attractions, string? subattractions, string? events, RouteService routeService) =>
            {
                if (lat == null || lng == null)
                {
                    return Results.BadRequest(new { error = "lat and lng are required" });
                }

                try
                {
                    RouteFromPointQuery query = new RouteFromPointQuery
                    {
                        Lat = lat.Value,
                        Lng = lng.Value,
                        Duration = duration ?? "medium",
                        Transport = transport ?? "",
                        Attractions = attractions ?? "",
                        Subattractions = subattractions ?? "",
                        Events = events ?? ""
                    };

                    RouteResponse response = await routeService.BuildRouteFromPointAsync(query);
                    return Results.Ok(response);
                }
                catch (Exception ex)
                {
                    return Results.Problem(detail: ex.Message, statusCode: 500);
                }
            });

            app.MapGet("/route-from-order", async (string? arrivalCode, string? duration, string? transport,
                string? attractions, string? subattractions, string? events, RouteService routeService) =>
            {
                if (string.IsNullOrEmpty(arrivalCode))
                {
                    return Results.BadRequest(new { error = "arrivalCode is required" });
                }

                try
                {
                    RouteFromOrderQuery query = new RouteFromOrderQuery
                    {
                        ArrivalCode = arrivalCode,
                        Duration = duration ?? "medium",
                        Transport = transport ?? "",
                        Attractions = attractions ?? "",
                        Subattractions = subattractions ?? "",
                        Events = events ?? ""
                    };

                    RouteResponse response = await routeService.BuildRouteFromOrderAsync(query);

                    if (response.VisitPoints.Length == 0)
                    {
                        return Results.NotFound(new { error = "station or airport not found for the given code" });
                    }

                    return Results.Ok(response);
                }
                catch (Exception ex)
                {
                    return Results.Problem(detail: ex.Message, statusCode: 500);
                }
            });

            app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

            app.Run();
        }
    }
}