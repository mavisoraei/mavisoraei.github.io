// assets/js/ai-api.js - Mock API stubs for AI flow
// Brother will replace only this file with real backend calls.

const AI_API = {
  async analyzeFace(photoBlob, options={}) {
    console.log('Mock analyzeFace called', { fileName: photoFile?.name, options });
    await new Promise(r => setTimeout(r, 1200));
    return {
      score: 84,
      areas: options.areas || ['Lips', 'Cheeks'],
      intensity: options.intensity || 'Balanced',
      summary: 'Balanced proportions with natural harmony.',
      subscores: {
        symmetry: 86,
        eyes: 82,
        nose: 88,
        lips: 84,
        jaw: 80
      },
      beforeImage: options.beforeDataUrl || null,
      afterImage: options.beforeDataUrl || null
    };
  },
  
  async analyzeBody(photoBlob, goal=5) {
    console.log('Mock analyzeBody called', { fileName: photoFile?.name, goal });
    await new Promise(r => setTimeout(r, 1200));
    return {
      goal,
      summary: `Projected outcome for ${goal} kg goal.`,
      beforeImage: null,
      afterImage: null
    };
  },
  
  async askQuestion(message) {
    console.log('Mock askQuestion called', { message });
    await new Promise(r => setTimeout(r, 800));
    const replies = [
      'Great question. Here are the next steps...',
      'Yes, this is possible. I can walk you through options.',
      'Based on your concern, I recommend booking a consultation.',
      'You can upload your photo and see the preview right away.',
      'Let me know if you want to focus on a specific area.'
    ];
    return {
      answer: replies[Math.floor(Math.random() * replies.length)]
    };
  }
};

