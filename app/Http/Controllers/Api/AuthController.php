<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Issue an API token for a valid user.
     */
    public function login(Request $request)
    {

    Log::debug("AuthController@login called", ['request' => $request->all()]);
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'device_name' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Credenciales incorrectas.',
            ], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        // Check if user belongs to a company
        if (!$user->company_id) {
            return response()->json([
                'message' => 'Usuario no asociado a una empresa activa.',
            ], 403);
        }

        // Create token with ability to access everything for now, or scope it
        $token = $user->createToken($request->device_name)->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'company_id' => $user->company_id,
            ]
        ]);
    }
}
