<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Species extends Model
{
    use HasFactory, BelongsToCompany, SoftDeletes;

    protected $table = 'species';

    protected $fillable = [
        'company_id',
        'family_id',
        'name',
        'scientific_name',
    ];

    /**
     * Get the family for the species.
     */
    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }

    /**
     * Get the varieties for the species.
     */
    public function varieties(): HasMany
    {
        return $this->hasMany(Variety::class);
    }

    /**
     * Get the harvest containers for the species.
     */
    public function harvestContainers(): HasMany
    {
        return $this->hasMany(HarvestContainer::class);
    }
}
