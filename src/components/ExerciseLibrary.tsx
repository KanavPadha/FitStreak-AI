import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Dumbbell, Play, ChevronRight, Info, CheckCircle2, X, Sparkles, Key, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { db, collection, query, where, getDocs, setDoc, doc, FirebaseUser } from '../lib/firebase';

// Extend window interface for AI Studio API key selection
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface Exercise {
  id: string;
  name: string;
  category: 'Strength' | 'Cardio' | 'Flexibility' | 'Core';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  images: string[];
  steps: string[];
  muscles: string[];
}

const exercises: Exercise[] = [
  {
    id: 'pushups',
    name: 'Standard Push-ups',
    category: 'Strength',
    difficulty: 'Beginner',
    images: [
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80'
    ],
    muscles: ['Chest', 'Triceps', 'Shoulders'],
    steps: [
      'Start in a plank position with hands slightly wider than shoulders.',
      'Lower your body until your chest nearly touches the floor.',
      'Keep your core tight and back flat throughout the movement.',
      'Push back up to the starting position.',
      'Repeat for desired repetitions.'
    ]
  },
  {
    id: 'squats',
    name: 'Bodyweight Squats',
    category: 'Strength',
    difficulty: 'Beginner',
    images: [
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?auto=format&fit=crop&w=1200&q=80'
    ],
    muscles: ['Quads', 'Glutes', 'Hamstrings'],
    steps: [
      'Stand with feet shoulder-width apart, toes slightly out.',
      'Lower your hips back and down as if sitting in a chair.',
      'Keep your chest up and knees behind your toes.',
      'Drive through your heels to return to standing.',
      'Squeeze your glutes at the top.'
    ]
  },
  {
    id: 'plank',
    name: 'Forearm Plank',
    category: 'Core',
    difficulty: 'Beginner',
    images: [
      'https://images.unsplash.com/photo-1566241142559-40e1bfc26ec7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1599058917233-57c0e62114e9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80'
    ],
    muscles: ['Abs', 'Lower Back', 'Shoulders'],
    steps: [
      'Place forearms on the floor with elbows under shoulders.',
      'Extend legs back, balancing on toes.',
      'Maintain a straight line from head to heels.',
      'Engage your core and glutes.',
      'Hold for the target duration.'
    ]
  },
  {
    id: 'lunges',
    name: 'Walking Lunges',
    category: 'Strength',
    difficulty: 'Beginner',
    images: [
      'https://images.unsplash.com/photo-1591258370814-01609b341790?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=1200&q=80'
    ],
    muscles: ['Quads', 'Glutes', 'Calves'],
    steps: [
      'Stand tall with feet hip-width apart.',
      'Step forward with one leg and lower your hips.',
      'Both knees should be bent at approximately 90 degrees.',
      'Push off the back foot and step forward with the other leg.',
      'Keep your torso upright throughout.'
    ]
  },
  {
    id: 'burpees',
    name: 'Classic Burpees',
    category: 'Cardio',
    difficulty: 'Advanced',
    images: [
      'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80'
    ],
    muscles: ['Full Body', 'Heart'],
    steps: [
      'Start in a standing position.',
      'Drop into a squat and place hands on the floor.',
      'Kick feet back into a plank position.',
      'Perform a push-up (optional).',
      'Jump feet back to hands and jump up explosively.'
    ]
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    category: 'Cardio',
    difficulty: 'Intermediate',
    images: [
      'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1599058917233-57c0e62114e9?auto=format&fit=crop&w=1200&q=80'
    ],
    muscles: ['Abs', 'Shoulders', 'Heart'],
    steps: [
      'Start in a high plank position.',
      'Drive one knee toward your chest.',
      'Quickly switch legs, bringing the other knee forward.',
      'Maintain a flat back and steady rhythm.',
      'Keep your core engaged.'
    ]
  }
];

export default function ExerciseLibrary({ user }: { user: FirebaseUser | null }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = React.useState<Exercise | null>(null);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationStatus, setGenerationStatus] = React.useState('');
  const [localExercises, setLocalExercises] = React.useState<Exercise[]>(exercises);

  // Load user-generated images from Firestore
  React.useEffect(() => {
    const loadUserImages = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'user_exercise_images'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const userImagesMap: Record<string, string[]> = {};
        querySnapshot.forEach((doc) => {
          userImagesMap[doc.id] = doc.data().images;
        });

        if (Object.keys(userImagesMap).length > 0) {
          setLocalExercises(prev => prev.map(ex => ({
            ...ex,
            images: userImagesMap[ex.id] || ex.images
          })));
        }
      } catch (error) {
        console.error('Error loading user images:', error);
      }
    };
    loadUserImages();
  }, [user]);

  const filteredExercises = localExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(localExercises.map(ex => ex.category)));

  const handleOpenExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setActiveImageIndex(0);
  };

  const generateAIVisuals = async (exercise: Exercise) => {
    try {
      setIsGenerating(true);
      setGenerationStatus('Checking API Key...');

      const isAIStudio = !!window.aistudio;
      if (isAIStudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setGenerationStatus('Please select an API key to continue...');
          await window.aistudio.openSelectKey();
          setGenerationStatus('Key selected. Starting generation...');
        }
      }

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "undefined") {
        setGenerationStatus('Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file and restart the server.');
        setIsGenerating(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const newImages: string[] = [];

      const prompts = [
        `A high-quality, realistic, professional fitness photograph of a person in a gym performing ${exercise.name}. Starting position, cinematic lighting, sharp focus, 8k resolution.`,
        `A high-quality, realistic, professional fitness photograph of a person in a gym performing ${exercise.name}. Mid-movement or bottom position, showing muscle engagement, cinematic lighting, sharp focus, 8k resolution.`,
        `A high-quality, realistic, professional fitness photograph of a person in a gym performing ${exercise.name}. Finishing the movement, focus on form and stability, cinematic lighting, sharp focus, 8k resolution.`
      ];

      for (let i = 0; i < prompts.length; i++) {
        setGenerationStatus(`Generating image ${i + 1} of 3...`);
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: { parts: [{ text: prompts[i] }] },
          config: {
            imageConfig: {
              aspectRatio: "16:9",
              imageSize: "1K"
            }
          }
        });

        if (response.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              newImages.push(`data:image/png;base64,${part.inlineData.data}`);
            }
          }
        }
      }

      if (newImages.length > 0) {
        const updatedExercises = localExercises.map(ex => 
          ex.id === exercise.id ? { ...ex, images: newImages } : ex
        );
        setLocalExercises(updatedExercises);
        setSelectedExercise({ ...exercise, images: newImages });
        setActiveImageIndex(0);
        
        // Save to Firestore if user is logged in
        if (user) {
          try {
            await setDoc(doc(db, 'user_exercise_images', exercise.id), {
              userId: user.uid,
              images: newImages,
              updatedAt: new Date().toISOString()
            });
            setGenerationStatus('Success! Visuals saved to your library.');
          } catch (error) {
            console.error('Error saving to Firestore:', error);
            setGenerationStatus('Success! Visuals updated (local only).');
          }
        } else {
          setGenerationStatus('Success! Visuals updated.');
        }
      } else {
        setGenerationStatus('Failed to generate images. Please try again.');
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      if (error.message?.includes('Requested entity was not found')) {
        setGenerationStatus('API Key error. Please re-select your key.');
        await window.aistudio.openSelectKey();
      } else {
        setGenerationStatus('Error generating visuals. Check console for details.');
      }
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setGenerationStatus('');
      }, 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 font-medium focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              !selectedCategory ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExercises.map((exercise, index) => (
          <motion.div
            key={exercise.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -5 }}
            onClick={() => handleOpenExercise(exercise)}
            className="glass group cursor-pointer rounded-[2rem] overflow-hidden border border-white/5 hover:border-white/20 transition-all"
          >
            <div className="aspect-video relative overflow-hidden">
              <img
                src={exercise.images[0]}
                alt={exercise.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-blue-600 text-[10px] font-black uppercase tracking-widest">
                  {exercise.category}
                </span>
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/60">
                  <Info size={12} />
                  <span>{exercise.difficulty}</span>
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">{exercise.name}</h3>
              <div className="flex flex-wrap gap-2">
                {exercise.muscles.map(m => (
                  <span key={m} className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    #{m}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-500 group-hover:translate-x-1 transition-transform">
                <span>View Details</span>
                <ChevronRight size={14} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Exercise Detail Modal */}
      <AnimatePresence>
        {selectedExercise && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] relative shadow-2xl border border-white/10"
            >
              <button
                onClick={() => setSelectedExercise(null)}
                className="absolute top-6 right-6 z-10 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all"
              >
                <X size={24} />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="flex flex-col h-full">
                  <div className="h-64 lg:h-[400px] relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        src={selectedExercise.images[activeImageIndex]}
                        alt={selectedExercise.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent lg:hidden" />
                  </div>
                  
                  {/* Image Gallery Thumbnails */}
                  <div className="p-4 flex gap-3 overflow-x-auto no-scrollbar bg-black/20">
                    {selectedExercise.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                          activeImageIndex === idx ? 'border-blue-500 scale-105' : 'border-transparent opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="p-8 lg:p-12 space-y-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full bg-blue-600 text-[10px] font-black uppercase tracking-widest">
                        {selectedExercise.category}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        {selectedExercise.difficulty}
                      </span>
                    </div>
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-4">
                      {selectedExercise.name}
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {selectedExercise.muscles.map(m => (
                        <span key={m} className="px-3 py-1 rounded-lg bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/60">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">How to perform</h4>
                      <button
                        onClick={() => generateAIVisuals(selectedExercise)}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-400 transition-all disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Sparkles size={12} />
                        )}
                        <span>{isGenerating ? generationStatus : 'Generate Real AI Visuals'}</span>
                      </button>
                    </div>
                    <div className="space-y-4">
                      {selectedExercise.steps.map((step, i) => (
                        <div key={i} className="flex gap-4 group">
                          <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0 text-blue-500 text-[10px] font-black">
                            {i + 1}
                          </div>
                          <p className="text-sm font-medium text-white/70 leading-relaxed group-hover:text-white transition-colors">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedExercise(null)}
                    className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-white/90 transition-all"
                  >
                    Got it, Coach!
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
