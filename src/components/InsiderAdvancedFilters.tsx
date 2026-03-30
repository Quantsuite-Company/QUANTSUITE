import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FilterState {
  type: string;
  minValue: string;
  maxValue: string;
  dateFrom: string;
  dateTo: string;
}

interface InsiderAdvancedFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
}

export function InsiderAdvancedFilters({ filters, onFilterChange, onReset }: InsiderAdvancedFiltersProps) {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Advanced Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Transaction Type</Label>
            <Select value={filters.type} onValueChange={(v) => updateFilter("type", v)}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Buy">Buy Only</SelectItem>
                <SelectItem value="Sell">Sell Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Date From</Label>
            <Input 
              type="date" 
              value={filters.dateFrom}
              onChange={(e) => updateFilter("dateFrom", e.target.value)}
            />
          </div>
          
          <div>
            <Label>Date To</Label>
            <Input 
              type="date" 
              value={filters.dateTo}
              onChange={(e) => updateFilter("dateTo", e.target.value)}
            />
          </div>
          
          <div>
            <Label>Min Value ($)</Label>
            <Input 
              type="number" 
              placeholder="0"
              value={filters.minValue}
              onChange={(e) => updateFilter("minValue", e.target.value)}
            />
          </div>
          
          <div>
            <Label>Max Value ($)</Label>
            <Input 
              type="number" 
              placeholder="Any"
              value={filters.maxValue}
              onChange={(e) => updateFilter("maxValue", e.target.value)}
            />
          </div>
        </div>
        
        <Button onClick={onReset} variant="outline" size="sm" className="w-full">
          Reset Filters
        </Button>
      </CardContent>
    </Card>
  );
}
