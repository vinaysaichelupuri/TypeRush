import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  deleteField
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { RaceRoom, Player, RaceProgress } from '../types';

export class FirebaseService {
  // Create a new race room
  static async createRoom(creatorName: string, text: string, maxPlayers: number = 6): Promise<string> {
  const creatorId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const roomData: Omit<RaceRoom, 'id'> = {
    creatorId,
    text,
    status: 'waiting',
    players: {
      [creatorId]: {
        id: creatorId,
        name: creatorName,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        isFinished: false,
        joinedAt: Date.now()
      }
    },
    createdAt: Date.now(),
    maxPlayers
  };



  try {
    const docRef = await addDoc(collection(db, 'races'), roomData);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (err) {
    console.error("Error in FirebaseService.createRoom:", err); // <--- ADD THIS
    throw err;
  }
}

  static async setPlayerReady(roomId: string, playerId: string, isReady: boolean): Promise<void> {
    const roomRef = doc(db, 'races', roomId);
    await updateDoc(roomRef, {
      [`players.${playerId}.isReady`]: isReady
    });
  }

  // Creator starts a new race after everyone is ready
  static async restartRace(roomId: string, selectedText: string): Promise<void> {
    const roomRef = doc(db, 'races', roomId);
    // Reset all players' progress, isFinished, isReady
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');
    const roomData = roomSnap.data() as RaceRoom;
    const updates: any = {};
    Object.keys(roomData.players).forEach(pid => {
      updates[`players.${pid}.progress`] = 0;
      updates[`players.${pid}.wpm`] = 0;
      updates[`players.${pid}.accuracy`] = 100;
      updates[`players.${pid}.isFinished`] = false;
      updates[`players.${pid}.isReady`] = false;
      updates[`players.${pid}.finishTime`] = null;
    });
    await updateDoc(roomRef, {
      ...updates,
      status: 'waiting',
      text: selectedText,
      countdownStartedAt: null,
      startedAt: null
    });
  }

  // Join an existing room
  static async joinRoom(roomId: string, playerName: string): Promise<string | null> {
    console.log('Attempting to join room:', roomId);
    
    const roomRef = doc(db, 'races', roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      console.error('Room document does not exist:', roomId);
      throw new Error('Room not found');
    }

    const roomData = roomSnap.data() as RaceRoom;
    console.log('Room data found:', roomData);
    
    if (roomData.status !== 'waiting') {
      throw new Error('Race has already started or finished');
    }

    const playerCount = Object.keys(roomData.players).length;
    if (playerCount >= roomData.maxPlayers) {
      throw new Error('Room is full');
    }

    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      isFinished: false,
      joinedAt: Date.now()
    };

    await updateDoc(roomRef, {
      [`players.${playerId}`]: newPlayer
    });

    console.log('Successfully joined room as player:', playerId);
    return playerId;
  }

  // Start the race (only creator can do this)
  static async startCountdown(roomId: string, creatorId: string): Promise<void> {
    const roomRef = doc(db, 'races', roomId);
    const roomSnap = await getDoc(roomRef);
    
    if (!roomSnap.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomSnap.data() as RaceRoom;
    
    if (roomData.creatorId !== creatorId) {
      throw new Error('Only the room creator can start the race');
    }

    if (roomData.status !== 'waiting') {
      throw new Error('Race has already started or finished');
    }

    await updateDoc(roomRef, {
      status: 'countdown',
      countdownStartedAt: Date.now()
    });
  }

  // Start the actual race after countdown
  static async startRace(roomId: string): Promise<void> {
    console.log('Starting race for room:', roomId);
    const roomRef = doc(db, 'races', roomId);
    
    await updateDoc(roomRef, {
      status: 'racing',
      startedAt: Date.now()
    });
    
    console.log('Race started successfully');
  }

  // Update player progress
  static async updateProgress(roomId: string, playerId: string, progress: RaceProgress): Promise<void> {
    const roomRef = doc(db, 'races', roomId);
    
    await updateDoc(roomRef, {
      [`players.${playerId}.progress`]: progress.progress,
      [`players.${playerId}.wpm`]: progress.wpm,
      [`players.${playerId}.accuracy`]: progress.accuracy,
      [`players.${playerId}.isFinished`]: progress.isFinished,
      ...(progress.isFinished && { [`players.${playerId}.finishTime`]: progress.timestamp })
    });
  }

  // Listen to room updates
  static subscribeToRoom(roomId: string, callback: (room: RaceRoom | null) => void): () => void {
    const roomRef = doc(db, 'races', roomId);
    
    return onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        const roomData = { id: doc.id, ...doc.data() } as RaceRoom;
        callback(roomData);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to room updates:', error);
      callback(null);
    });
  }

  // Leave room
  static async leaveRoom(roomId: string, playerId: string): Promise<void> {
    const roomRef = doc(db, 'races', roomId);
    
    await updateDoc(roomRef, {
      [`players.${playerId}`]: deleteField()
    });
  }

  // Check if room exists
  static async roomExists(roomId: string): Promise<boolean> {
    const roomRef = doc(db, 'races', roomId);
    const roomSnap = await getDoc(roomRef);
    return roomSnap.exists();
  }
}