<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCompanyAccess
{
    /**
     * Handle an incoming request.
     * Redirects users without a company to the company setup page.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check() && !auth()->user()->company_id) {
            // Allow access to company setup routes
            if ($request->routeIs('company.*') || $request->routeIs('logout')) {
                return $next($request);
            }
            
            return redirect()->route('company.setup');
        }

        return $next($request);
    }
}
