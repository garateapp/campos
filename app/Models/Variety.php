<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Variety extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company_id',
        'species_id',
        'name',
    ];

    /**
     * Get the species that owns the variety.
     */
    public function species(): BelongsTo
    {
        return $this->belongsTo(Species::class);
    }
}
