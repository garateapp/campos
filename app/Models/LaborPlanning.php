<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\LaborType;
use App\Models\UnitOfMeasure;

class LaborPlanning extends Model
{
    use HasFactory, SoftDeletes, BelongsToCompany;

    protected $fillable = [
        'company_id',
        'year',
        'month',
        'field_id',
        'planting_id',
        'species_id',
        'planting_year',
        'cc',
        'hectares',
        'num_plants',
        'kilos',
        'meters',
        'task_type_id',
        'labor_type_id',
        'unit_of_measure_id',
        'num_jh_planned',
        'avg_yield_planned',
        'total_jh_planned',
        'effective_days_planned',
        'value_planned',
        'total_value_planned',
        'avg_yield_actual',
        'total_jh_actual',
        'jh_ha_actual',
        'value_actual',
        'total_value_actual',
    ];

    protected $casts = [
        'hectares' => 'decimal:2',
        'kilos' => 'decimal:2',
        'meters' => 'decimal:2',
        'num_jh_planned' => 'decimal:2',
        'avg_yield_planned' => 'decimal:2',
        'total_jh_planned' => 'decimal:2',
        'value_planned' => 'decimal:2',
        'total_value_planned' => 'decimal:2',
        'avg_yield_actual' => 'decimal:2',
        'total_jh_actual' => 'decimal:2',
        'jh_ha_actual' => 'decimal:2',
        'value_actual' => 'decimal:2',
        'total_value_actual' => 'decimal:2',
    ];

    /**
     * Get the field associated with the labor planning.
     */
    public function field(): BelongsTo
    {
        return $this->belongsTo(Field::class);
    }

    /**
     * Get the species associated with the labor planning.
     */
    public function species(): BelongsTo
    {
        return $this->belongsTo(Species::class);
    }

    /**
     * Optional planting reference to reuse crop data.
     */
    public function planting(): BelongsTo
    {
        return $this->belongsTo(Planting::class);
    }

    /**
     * Get the variety associated with the labor planning.
     */
    public function variety(): BelongsTo
    {
        return $this->belongsTo(Variety::class);
    }

    /**
     * Get the varieties associated with this planning entry (supports multiples per task).
     */
    public function varieties(): BelongsToMany
    {
        return $this->belongsToMany(Variety::class, 'labor_planning_variety')->withTimestamps();
    }

    /**
     * Get the task type associated with the labor planning.
     */
    public function taskType(): BelongsTo
    {
        return $this->belongsTo(TaskType::class);
    }

    /**
     * Get the labor type associated with the labor planning.
     */
    public function laborType(): BelongsTo
    {
        return $this->belongsTo(LaborType::class);
    }

    /**
     * Get the unit of measure associated with the labor planning.
     */
    public function unitOfMeasure(): BelongsTo
    {
        return $this->belongsTo(UnitOfMeasure::class);
    }
}
