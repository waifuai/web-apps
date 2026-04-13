export class Simulation {
  constructor() {
    this.reset();
  }

  reset() {
    this.users = this.createUsers(1000);
    this.price = 1.0;
    this.supply = 1_000_000;
    this.history = [];
    this.stepCount = 0;
    this.burnRate = 0.02;
    this.currentStrategy = "None";
  }

  createUsers(count) {
    const types = ['speculator', 'holder', 'hunter', 'active'];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      type: types[i % types.length],
      balance: 1000,
      activity: Math.random(),
      lastAction: 'hold',
      vested: 0,
      vestingReleased: 0
    }));
  }

  applyAirdrop(strategy) {
    const validUsers = this.users.filter(u => u.balance > 0);
    this.currentStrategy = strategy;
    
    switch(strategy) {
      case 'lottery':
        const winners = validUsers.sort(() => 0.5 - Math.random()).slice(0, 50);
        winners.forEach(u => u.balance += 500);
        this.supply += winners.length * 500;
        break;
        
      case 'uniform':
        validUsers.forEach(u => u.balance += 100);
        this.supply += validUsers.length * 100;
        break;
        
      case 'tiered':
        validUsers.sort((a, b) => b.balance - a.balance);
        let totalDistributed = 0;
        
        validUsers.forEach((u, i) => {
          const tier = Math.floor(i / (validUsers.length / 4));
          const amount = [200, 150, 100, 50][tier];
          u.balance += amount;
          totalDistributed += amount;
        });
        
        this.supply += totalDistributed;
        break;
        
      case 'vesting':
        validUsers.forEach(u => {
          u.vested += 500;
          u.balance += 100;
        });
        this.supply += validUsers.length * 100; 
        break;
    }
  }

  step() {
    let netVolume = 0;
    
    if (this.currentStrategy === 'vesting') {
      this.users.forEach(user => {
        if (user.vested > 0) {
          const releaseAmount = Math.min(5, user.vested); 
          user.vested -= releaseAmount;
          user.balance += releaseAmount;
          user.vestingReleased += releaseAmount;
          this.supply += releaseAmount; 
        }
      });
    }
    
    this.users.forEach(user => {
      let amount = 0;
      const sentiment = Math.random();
      
      switch(user.type) {
        case 'speculator':
          if (sentiment > 0.7) amount = user.balance * 0.8;
          else if (sentiment < 0.3) amount = -user.balance * 0.5;
          break;
          
        case 'holder':
          if (this.price < 0.8) amount = user.balance * 0.2;
          else if (sentiment < 0.1 && this.price > 1.5) amount = -user.balance * 0.1;
          break;
          
        case 'hunter':
          if (this.stepCount % 10 === 0) amount = user.balance * 0.5;
          else if (sentiment < 0.2) amount = -user.balance * 0.8;
          break;
          
        case 'active':
          amount = user.balance * (sentiment - 0.5) * 0.2;
          break;
      }
      
      if (amount < 0) {
        amount = Math.max(-user.balance, amount);
      }
      
      if (amount !== 0) {
        let burn = Math.abs(amount) * this.burnRate;
        
        if (this.supply - burn > 0) {
          this.supply -= burn;
        } else {
          burn = this.supply;
          this.supply = 0;
        }
        
        amount -= Math.sign(amount) * burn;
        
        user.balance += amount;
        netVolume += amount;
        user.lastAction = amount > 0 ? 'buy' : 'sell';
      }
    });

    this.supply = Math.max(0, this.supply);
    const priceImpact = this.supply > 0 ? netVolume / this.supply : 0;
    this.price *= 1 + priceImpact * 10;
    this.price = Math.max(0.01, this.price); 
    
    this.history.push({
      price: this.price,
      supply: this.supply,
      step: this.stepCount++,
      strategy: this.currentStrategy
    });
  }
}