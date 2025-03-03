import React, { useState, useEffect } from 'react';
import { supabaseFunctions } from '@/lib/supabase';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem,
  CommandList 
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExerciseSearchProps {
  value: string;
  exerciseCatalogueId?: string;
  onChange: (value: string, exerciseCatalogueId?: string) => void;
  placeholder?: string;
}

interface Exercise {
  name: string;
  exercise_catalogue_id: string;
}

export function ExerciseSearch({ 
  value, 
  exerciseCatalogueId, 
  onChange, 
  placeholder = "Search for an exercise..." 
}: ExerciseSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch exercises when search term changes
  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabaseFunctions.getExerciseCatalogue(searchTerm, 20);
        if (error) {
          console.error('Error fetching exercises:', error);
          setExercises([]);
        } else if (data) {
          // Ensure data is an array and all items have the required properties
          const validExercises = Array.isArray(data) 
            ? data.filter(item => 
                item && 
                typeof item === 'object' && 
                'name' in item && 
                'exercise_catalogue_id' in item
              )
            : [];
          
          setExercises(validExercises as Exercise[]);
        } else {
          setExercises([]);
        }
      } catch (error) {
        console.error('Error in exercise search:', error);
        setExercises([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [searchTerm]);

  // If we have an exerciseCatalogueId but no exercises loaded yet, fetch the exercise name
  useEffect(() => {
    if (exerciseCatalogueId && !value) {
      const fetchExercise = async () => {
        try {
          const { data, error } = await supabaseFunctions.getExerciseById(exerciseCatalogueId);
          if (error) {
            console.error('Error fetching exercise by ID:', error);
          } else if (data && data.name && data.exercise_catalogue_id) {
            onChange(data.name, data.exercise_catalogue_id);
          }
        } catch (error) {
          console.error('Error fetching exercise by ID:', error);
        }
      };

      fetchExercise();
    }
  }, [exerciseCatalogueId, value, onChange]);

  // Safe value for display
  const displayValue = value || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput 
            placeholder="Search exercises..." 
            value={searchTerm}
            onValueChange={(value) => setSearchTerm(value || '')}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading exercises...
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {searchTerm ? 'No exercises found.' : 'Type to search exercises.'}
                </CommandEmpty>
                <CommandGroup>
                  {exercises && exercises.length > 0 ? exercises.map((exercise) => (
                    <CommandItem
                      key={exercise.exercise_catalogue_id}
                      value={exercise.name}
                      onSelect={() => {
                        onChange(exercise.name, exercise.exercise_catalogue_id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          exerciseCatalogueId === exercise.exercise_catalogue_id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {exercise.name}
                    </CommandItem>
                  )) : (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No exercises found
                    </div>
                  )}
                </CommandGroup>
              </>
            )}
          </CommandList>
          <div className="border-t p-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm text-muted-foreground"
              onClick={() => {
                onChange(searchTerm || '', undefined);
                setOpen(false);
              }}
            >
              Use custom name: {searchTerm || "Type a name"}
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 