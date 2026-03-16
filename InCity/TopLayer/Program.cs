using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using MidLayer.Contracts;
using MidLayer.DataAccess;
using TopLayer.Repositories;
using TopLayer.Services;

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

            app.MapGet("/route-from-point", async ([AsParameters] RouteFromPointQuery query, RouteService routeService) =>
            {
                if (query.Lat == 0 && query.Lng == 0)
                {
                    return Results.BadRequest(new { error = "lat and lng are required" });
                }

                try
                {
                    RouteResponse response = await routeService.BuildRouteFromPointAsync(query);
                    return Results.Ok(response);
                }
                catch (Exception ex)
                {
                    return Results.Problem(detail: ex.Message, statusCode: 500);
                }
            });

            app.MapGet("/route-from-order", async ([AsParameters] RouteFromOrderQuery query, RouteService routeService) =>
            {
                if (string.IsNullOrEmpty(query.ArrivalCode))
                {
                    return Results.BadRequest(new { error = "arrivalCode is required" });
                }

                try
                {
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
