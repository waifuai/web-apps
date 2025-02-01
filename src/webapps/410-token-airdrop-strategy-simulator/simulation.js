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
  }

  createUsers(count) {
    const types = ['speculator', 'holder', 'hunter', 'active'];
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      type: types[i % types.length],
      balance: 1000,
      activity: Math.random(),
      lastAction: 'hold',
      vested: 0
    }));
  }

  applyAirdrop(strategy) {
    const validUsers = this.users.filter(u => u.balance > 0);
    
    switch(strategy) {
      case 'lottery':
        const winners = validUsers.sort(() => 0.5 - Math.random()).slice(0, 50);
        winners.forEach(u => u.balance += 500);
        break;
        
      case 'uniform':
        validUsers.forEach(u => u.balance += 100);
        break;
        
      case 'tiered':
        validUsers.sort((a, b) => b.balance - a.balance);
        validUsers.forEach((u, i) => {
          const tier = Math.floor(i / (validUsers.length / 4));
          u.balance += [200, 150, 100, 50][tier];
        });
        break;
        
      case 'vesting':
        validUsers.forEach(u => {
          u.vested += 500;
          u.balance += 100;
        });
        break;
    }
    
    this.supply += validUsers.length * 100;
  }

  step() {
    let netVolume = 0;
    
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
          break;
          
        case 'hunter':
          if (this.stepCount % 10 === 0) amount = user.balance;
          break;
          
        case 'active':
          amount = user.balance * (user.activity - 0.5) * 0.1;
          break;
      }
      
      if (amount !== 0) {
        const burn = Math.abs(amount) * this.burnRate;
        this.supply -= burn;
        amount -= Math.sign(amount) * burn;
        
        user.balance += amount;
        netVolume += amount;
        user.lastAction = amount > 0 ? 'buy' : 'sell';
      }
    });

    // Update price based on net volume
    const priceImpact = netVolume / this.supply;
    this.price *= 1 + priceImpact * 10;
    
    this.history.push({
      price: this.price,
      supply: this.supply,
      step: this.stepCount++
    });
  }
}