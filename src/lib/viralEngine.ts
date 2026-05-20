// src/lib/viralEngine.ts

export const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    }
    return Math.abs(hash);
};

export const calculateFakeFollowers = (id: string, createdAt: string, postsCount: number, isFakeOn: boolean) => {
    if (!isFakeOn || !id || !createdAt) return 0;
    
    const now = Date.now();
    const createdTime = new Date(createdAt).getTime();
    if (createdTime > now) return 0;

    const ageInMinutes = Math.floor((now - createdTime) / 60000);
    const delayMinutes = 180; 
    if (ageInMinutes <= delayMinutes) return 0; 

    const activeHours = (ageInMinutes - delayMinutes) / 60;
    const hash = getHash(id);
    const tier = hash % 100;

    if (postsCount === 0) {
        const ghostMax = 10 + (hash % 40);
        return Math.floor(ghostMax * (1 - Math.exp(-activeHours / 48)));
    }
    
    let maxCap, speedFactor;

    if (tier < 60) {
        maxCap = 50 + (hash % 450);
        speedFactor = 24 * 15; 
    } else if (tier < 90) {
        maxCap = 1000 + (hash % 9000);
        speedFactor = 24 * 30;
    } else {
        maxCap = 15000 + (hash % 85000);
        speedFactor = 24 * 45;
    }

    const variance = 1 + ((hash % 10) / 100); 
    let baseFollowers = maxCap * (1 - Math.exp(-(activeHours * variance) / speedFactor));

    if (baseFollowers > 100) {
        const daysActive = activeHours / 24;
        const churn = Math.sin(daysActive * Math.PI) * (maxCap * 0.005);
        baseFollowers += churn;
    }
    
    return Math.max(0, Math.floor(baseFollowers));
};

export const calculateFakeEngagement = (id: string, createdAt: string, isFakeOn: boolean) => {
    if (!isFakeOn || !id || !createdAt) return { likes: 0, views: 0 };
    
    const now = Date.now();
    const createdTime = new Date(createdAt).getTime();
    if (createdTime > now) return { likes: 0, views: 0 };

    const ageInMinutes = Math.floor((now - createdTime) / 60000);
    const delayMinutes = 120;
    if (ageInMinutes <= delayMinutes) return { likes: 0, views: 0 };

    const activeHours = (ageInMinutes - delayMinutes) / 60;
    const hash = getHash(id);
    const tier = hash % 100;
    
    let maxViews, speedFactor;

    if (tier < 50) {
        maxViews = 500 + (hash % 2000); 
        speedFactor = 12; 
    } else if (tier < 85) {
        maxViews = 4000 + (hash % 16000); 
        speedFactor = 24; 
    } else {
        maxViews = 50000 + (hash % 200000); 
        speedFactor = 48; 
    }

    const surge = (tier >= 85 && activeHours < 48) ? 1.5 : 1;
    const currentViews = Math.floor(maxViews * (1 - Math.exp(-(activeHours * surge) / speedFactor)));
    const engagementRate = 0.04 + ((hash % 80) / 1000);
    const currentLikes = Math.floor(currentViews * engagementRate);

    return { 
        views: currentViews > 0 ? currentViews : 0, 
        likes: currentLikes > 0 ? currentLikes : 0 
    };
};