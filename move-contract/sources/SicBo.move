address admin {
module SicBo {
    use StarcoinFramework::Signer;
    use StarcoinFramework::Timestamp;
    use StarcoinFramework::Account;
    use StarcoinFramework::Token;
    // use StarcoinFramework::Event;
    use StarcoinFramework::Vector;
    use StarcoinFramework::Hash;
    use StarcoinFramework::BCS;
    // use SFC::PseudoRandom;

    struct Bank<phantom T: store> has store, key {
        bank: Token::Token<T>
    }

    struct Game has key, store, drop {
        aliceSecret: vector<u8>,
        bobNum: u8,
        aliceNum: u8,
        timestamp: u64,
        amount: u128,
        campRaw: vector<u8>,
        camp: vector<u8>,
        aliceWin: bool,
        bobWin: bool
    }
    
 

    /// @admin init bank
    public(script) fun init_bank<TokenType: store>(signer: signer, amount: u128) {
        let account = &signer;
        let signer_addr = Signer::address_of(account);

        assert!(signer_addr == @admin, 10003);
        assert!(! exists<Bank<TokenType>>(signer_addr), 10004);
        assert!(Account::balance<TokenType>(signer_addr) >= amount, 10005);

        let token = Account::withdraw<TokenType>(account, amount);
        move_to(account, Bank<TokenType>{
            bank: token
        });

        // move_to(account, BankEvent<TokenType>{
        //     check_event: Event::new_event_handle<CheckEvent>(account),
        // });
    }

    public(script) fun init_game<TokenType: store>(alice: signer, aliceSecret: vector<u8>, amount: u128) acquires Bank {
        let account = &alice;

        let token = Account::withdraw<TokenType>(account, amount);
        let bank = borrow_global_mut<Bank<TokenType>>(@admin);
        Token::deposit<TokenType>(&mut bank.bank, token);

        move_to(account, Game {
            aliceSecret: aliceSecret,
            bobNum: 10,
            aliceNum: 10,
            timestamp: Timestamp::now_seconds(),
            amount: amount,
            campRaw: Vector::empty(),
            camp: Vector::empty(),
            aliceWin: false,
            bobWin: false,
        });
    }

    public(script) fun bob_what<TokenType: store>(bob: signer, alice: address, bobNum: u8, amount: u128) acquires Game, Bank {
        let account = &bob;

        let token = Account::withdraw<TokenType>(account, amount);
        let bank = borrow_global_mut<Bank<TokenType>>(@admin);
        Token::deposit<TokenType>(&mut bank.bank, token);

        let game = borrow_global_mut<Game>(alice);
        game.bobNum = bobNum;
        game.amount = game.amount + amount;
    }

    public(script) fun alice_what<TokenType: store>(alice: signer, aliceNum: u8) acquires Game {
        let account = &alice;
        // let token = Account::withdraw<TokenType>(account, amount);

        let game = borrow_global_mut<Game>(Signer::address_of(account));
        game.aliceNum = aliceNum;

        // check valid
        let tmpVec = Vector::empty();
        let tempCamp = Vector::empty();

        let addr = Signer::address_of(account);
        Vector::append(&mut tmpVec, BCS::to_bytes(&addr));
        Vector::append(&mut tmpVec, BCS::to_bytes(&aliceNum));
        
        Vector::append(&mut tempCamp, BCS::to_bytes(&addr));
        Vector::append(&mut tempCamp, BCS::to_bytes(&aliceNum));
        
        game.campRaw = tmpVec;
        let camp = Hash::sha3_256(tempCamp);
        game.camp = camp;
        

        if (&game.camp == &game.aliceSecret) {
            game.aliceWin = true;
        } else {
            game.bobWin = true;
        }

        move_from<Game>(game.aliceAddr);
    }

    public(script) fun win_token<TokenType: store>(alice: signer) acquires Game, Bank {
        let account = &alice;
        let game = borrow_global_mut<Game>(Signer::address_of(account));

        let bank = borrow_global_mut<Bank<TokenType>>(@admin);
        let token = Token::withdraw<TokenType>(&mut bank.bank, game.amount);
        Account::deposit<TokenType>(Signer::address_of(account), token);

        move_from<Game>(Signer::address_of(account));

        // let maxValue = Token::value(&game.arbiter);
        // let token = Token::withdraw<TokenType>(&mut game.arbiter, maxValue);

    }


    // public(script) fun win_token<TokenType: store>(alice: signer) acquires Game {
    //     let account = &alice;
    //     let game = borrow_global_mut<Game<TokenType>>(Signer::address_of(account));

    //     let maxValue = Token::value(&game.arbiter);
    //     let token = Token::withdraw<TokenType>(&mut game.arbiter, maxValue);

    //     Account::deposit<TokenType>(Signer::address_of(account), token);
    // }

    // public(script) fun clean_game<TokenType: store>(alice: signer) acquires Game {
    //     let account = &alice;
    //     let game = borrow_global_mut<Game<TokenType>>(Signer::address_of(account));
    //     move_from(account, game)
    // }
    


   

    // public fun new(account: &signer, name: vector<u8>) {
        // let account_address = ;
        // let exist = Vector::contains<vector<u8>>(&borrow_global<UniqIdList>(account_address).data, &name);
        // assert(!exist, 1);
        // let id_list = borrow_global_mut<Counter>(Signer::address_of(account));
            // let counter = borrow_global<Counter>(Signer::address_of(account));
        // Vector::push_back<vector<u8>>(&mut id_list.data, copy name);
        // NFT { name }
    // }

    //  public(script) fun init_counter(account: signer){
    //     Self::init(&account)
    //  }

    //  public(script) fun change_name(account: signer,  name: vector<u8>)  acquires Counter {
    //     Self::name_change(&account, name)
    //  }
}
}