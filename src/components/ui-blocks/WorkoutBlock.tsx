import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Block, supabaseFunctions } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import React from "react";
import { ExerciseSearch } from "./ExerciseSearch";

interface WorkoutBlockProps {
  block: Block;
  className?: string;
}

export function WorkoutBlock({ block, className }: WorkoutBlockProps) {
  console.group('🧱 Rendering WorkoutBlock');
  console.log('Block data:', block);
  
  const renderBlockContent = () => {
    console.log('📦 Rendering block content for type:', block.block_type);
    switch (block.block_type) {
      case 'log_exercise':
        return <ExerciseBlock data={block.block_data} blockId={block.id} />;
      case 'asked_question':
        return <QuestionBlock data={block.block_data} />;
      case 'made_a_note':
        return <NoteBlock data={block.block_data} />;
      default:
        console.warn('⚠️ Unknown block type:', block.block_type);
        return <div>Unknown block type: {block.block_type}</div>;
    }
  };

  const getBlockTitle = () => {
    switch (block.block_type) {
      case 'log_exercise':
        return 'Exercise';
      case 'asked_question':
        return 'Question';
      case 'made_a_note':
        return 'Note';
      default:
        return block.block_type;
    }
  };

  console.groupEnd();
  return (
    <Card className={cn("workout-card overflow-hidden animate-slide-in", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">{getBlockTitle()}</CardTitle>
          <div className="flex items-center gap-2">
            {block.block_type === 'log_exercise' && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => {
                  const event = new CustomEvent('edit-exercise', { detail: { blockId: block.id } });
                  document.dispatchEvent(event);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <TimeLabel date={new Date(block.created_at)} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderBlockContent()}
      </CardContent>
    </Card>
  );
}

function TimeLabel({ date }: { date: Date }) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Badge variant="outline" className="text-xs font-normal">
      {formatTime(date)}
    </Badge>
  );
}

function ExerciseBlock({ data, blockId }: { data: any, blockId: string }) {
  console.group('💪 Rendering ExerciseBlock');
  console.log('Exercise data:', data);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<any>(null);
  const [editedExerciseData, setEditedExerciseData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  
  React.useEffect(() => {
    const handleEditEvent = (event: any) => {
      if (event.detail.blockId === blockId && data.exercises && data.exercises.length > 0) {
        handleEditExercise(data.exercises[0]);
      }
    };
    
    document.addEventListener('edit-exercise', handleEditEvent);
    return () => {
      document.removeEventListener('edit-exercise', handleEditEvent);
    };
  }, [blockId, data]);
  
  useEffect(() => {
    const fetchExerciseNames = async () => {
      if (!data.exercises || !Array.isArray(data.exercises)) return;
      
      for (const exercise of data.exercises) {
        if (exercise && exercise.exercise_catalogue_id && !exercise.fetched_name) {
          try {
            const { data: exerciseData, error } = await supabaseFunctions.getExerciseById(exercise.exercise_catalogue_id);
            if (!error && exerciseData && exerciseData.name) {
              exercise.exercise_name = exerciseData.name;
              exercise.fetched_name = true;
            }
          } catch (error) {
            console.error('Error fetching exercise name:', error);
          }
        }
      }
    };
    
    fetchExerciseNames();
  }, [data.exercises]);
  
  if (!data.exercises) {
    console.warn('⚠️ No exercises found in data');
    console.groupEnd();
    return null;
  }
  
  const handleEditExercise = (exercise: any) => {
    if (!exercise) return;
    
    setEditingExercise(exercise);
    setEditedExerciseData({
      exercise_name: exercise.exercise_name || '',
      exercise_catalogue_id: exercise.exercise_catalogue_id,
      sets: Array.isArray(exercise.sets) 
        ? [...exercise.sets.map((set: any) => ({ ...set }))]
        : [],
      notes: exercise.notes || ""
    });
    setIsEditModalOpen(true);
  };
  
  const handleSaveExercise = async () => {
    setIsLoading(true);
    try {
      if (data.exercises && Array.isArray(data.exercises) && data.exercises.length > 0 && editingExercise) {
        const exerciseIndex = data.exercises.findIndex(
          (ex: any) => ex === editingExercise
        );
        
        if (exerciseIndex !== -1) {
          const updatedData = JSON.parse(JSON.stringify(data));
          
          updatedData.exercises[exerciseIndex] = {
            ...updatedData.exercises[exerciseIndex],
            exercise_name: editedExerciseData.exercise_name || '',
            exercise_catalogue_id: editedExerciseData.exercise_catalogue_id,
            sets: Array.isArray(editedExerciseData.sets) ? editedExerciseData.sets : [],
            notes: editedExerciseData.notes || ''
          };
          
          const { error } = await supabaseFunctions.updateBlockData(blockId, updatedData);
          
          if (error) {
            console.error('Error updating block data:', error);
          } else {
            console.log('Block data updated successfully');
            data.exercises[exerciseIndex] = {
              ...data.exercises[exerciseIndex],
              exercise_name: editedExerciseData.exercise_name || '',
              exercise_catalogue_id: editedExerciseData.exercise_catalogue_id,
              sets: Array.isArray(editedExerciseData.sets) ? editedExerciseData.sets : [],
              notes: editedExerciseData.notes || ''
            };
          }
        }
      }
    } catch (error) {
      console.error('Error saving exercise changes:', error);
    } finally {
      setIsLoading(false);
      setIsEditModalOpen(false);
    }
  };
  
  const updateSetValue = (setIndex: number, field: string, value: any) => {
    if (!editedExerciseData || !Array.isArray(editedExerciseData.sets)) {
      console.error('Cannot update set value: sets array is not valid');
      return;
    }
    
    const updatedSets = [...editedExerciseData.sets];
    if (setIndex >= 0 && setIndex < updatedSets.length) {
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        [field]: field === 'weight' || field === 'reps' ? Number(value) : value
      };
      
      setEditedExerciseData({
        ...editedExerciseData,
        sets: updatedSets
      });
    }
  };
  
  const handleExerciseChange = (name: string, catalogueId?: string) => {
    setEditedExerciseData({
      ...editedExerciseData,
      exercise_name: name || '',
      exercise_catalogue_id: catalogueId
    });
  };
  
  console.groupEnd();
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {Array.isArray(data.exercises) && data.exercises.map((exercise: any, index: number) => (
          <div 
            key={index} 
            className="flex flex-col p-3 rounded-lg bg-secondary/50"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{exercise?.exercise_name || 'Unnamed Exercise'}</span>
            </div>
            
            {Array.isArray(exercise?.sets) && exercise.sets.map((set: any, setIndex: number) => (
              <div key={setIndex} className="flex items-center justify-between py-1 border-t border-secondary">
                <span className="text-sm">Set {setIndex + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {(set?.weight > 0) ? `${set.weight}kg × ` : ''}{set?.reps || 0} reps
                  </span>
                  {set?.completed && (
                    <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="h-3 w-3 text-green-500" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {Array.isArray(exercise?.sets) && exercise.sets.some((set: any) => set?.notes) && (
              <div className="mt-2 text-xs text-muted-foreground">
                {exercise.sets.map((set: any, i: number) => 
                  set?.notes ? <p key={i}>Set {i+1}: {set.notes}</p> : null
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {data.notes && (
        <div className="text-sm text-muted-foreground mt-2">
          {data.notes}
        </div>
      )}
      
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Exercise</DialogTitle>
          </DialogHeader>
          
          {editingExercise && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="exercise-name" className="text-right">
                  Exercise
                </Label>
                <div className="col-span-3">
                  <ExerciseSearch 
                    value={editedExerciseData.exercise_name}
                    exerciseCatalogueId={editedExerciseData.exercise_catalogue_id}
                    onChange={handleExerciseChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rest-timer" className="text-right">
                  Rest Timer
                </Label>
                <Input
                  id="rest-timer"
                  value={editedExerciseData.rest_timer || "1min 30s"}
                  onChange={(e) => setEditedExerciseData({...editedExerciseData, rest_timer: e.target.value})}
                  className="col-span-3"
                />
              </div>
              
              <div className="border-t pt-4">
                <div className="font-medium mb-3">Sets</div>
                <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium">
                  <div className="col-span-1">SET</div>
                  <div className="col-span-3">PREVIOUS</div>
                  <div className="col-span-3">KG</div>
                  <div className="col-span-3">REPS</div>
                  <div className="col-span-2 text-center">DONE</div>
                </div>
                
                {Array.isArray(editedExerciseData?.sets) && editedExerciseData.sets.map((set: any, i: number) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center mb-3">
                    <div className="col-span-1 text-sm font-medium">{i + 1}</div>
                    <div className="col-span-3 text-sm text-muted-foreground">
                      {(set?.previous_weight || set?.weight || 0)}kg × {(set?.previous_reps || set?.reps || 0)}
                    </div>
                    <div className="col-span-3">
                      <Input
                        id={`weight-${i}`}
                        type="number"
                        value={set?.weight || 0}
                        onChange={(e) => updateSetValue(i, 'weight', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        id={`reps-${i}`}
                        type="number"
                        value={set?.reps || 0}
                        onChange={(e) => updateSetValue(i, 'reps', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <Checkbox 
                        id={`completed-${i}`}
                        checked={set?.completed || false}
                        onCheckedChange={(checked) => updateSetValue(i, 'completed', checked)}
                      />
                    </div>
                    {set?.notes ? (
                      <div className="col-span-12 mt-1">
                        <Input
                          id={`notes-${i}`}
                          placeholder="Add notes for this set"
                          value={set.notes}
                          onChange={(e) => updateSetValue(i, 'notes', e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="col-span-12 mt-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs text-muted-foreground"
                          onClick={() => updateSetValue(i, 'notes', '')}
                        >
                          + Add notes
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="exercise-notes" className="text-right">
                  Notes
                </Label>
                <Input
                  id="exercise-notes"
                  value={editedExerciseData.notes || ""}
                  onChange={(e) => setEditedExerciseData({...editedExerciseData, notes: e.target.value})}
                  className="col-span-3"
                  placeholder="Add notes for this exercise"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSaveExercise} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuestionBlock({ data }: { data: any }) {
  console.group('❓ Rendering QuestionBlock');
  console.log('Question data:', data);
  console.groupEnd();
  
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg bg-secondary/50">
        <div className="text-sm font-medium mb-1">Question:</div>
        <div>{data.userMessage}</div>
      </div>
      <div className="p-3 rounded-lg bg-primary/10">
        <div className="text-sm font-medium mb-1">Answer:</div>
        <div>{data.AIresponse}</div>
      </div>
    </div>
  );
}

function NoteBlock({ data }: { data: any }) {
  console.group('📝 Rendering NoteBlock');
  console.log('Note data:', data);
  console.groupEnd();
  
  return (
    <div className="p-3 rounded-lg bg-secondary/50">
      {data.note}
    </div>
  );
}
