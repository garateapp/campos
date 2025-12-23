<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contractor extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'business_name',
        'rut',
        'contact_name',
        'contact_email',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
