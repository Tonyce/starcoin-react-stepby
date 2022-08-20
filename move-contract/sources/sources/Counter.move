address admin {
module CounterV2 {

    use StarcoinFramework::Signer;
    use StarcoinFramework::Timestamp;
    // use StarcoinFramework::Account;
    // use StarcoinFramework::Token;
    // use StarcoinFramework::Event;
    use StarcoinFramework::Vector;
    use StarcoinFramework::BCS;

    struct Counter has key, store, drop {
        name: vector<u8>,
        value: u8,
        timestamp: u64,
        addr: address,
    }

    public(script) fun init_counter(account: signer){
        move_to(&account, Counter {
            name:Vector::empty(), 
            value: 0, 
            timestamp:Timestamp::now_seconds(),
            addr: Signer::address_of(&account)
        });
    }
    
    public(script) fun remove_counter(account: signer) acquires Counter {
        // let counter = borrow_global_mut<Counter>(Signer::address_of(&account));
        // move_to(&account, Counter {
        //     name:Vector::empty(), 
        //     value: 0, 
        //     timestamp:Timestamp::now_seconds()
        // });
        move_from<Counter>(Signer::address_of(&account));
     }

     public(script) fun name_change(account: signer,_name: vector<u8>) acquires Counter {

        let counter = borrow_global_mut<Counter>(Signer::address_of(&account));
        let addr = Signer::address_of(&account);
        Vector::append(&mut counter.name, BCS::to_bytes(&addr));
        counter.value = counter.value + 1;
     }
}
}