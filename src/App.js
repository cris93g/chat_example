import React, { useState, useEffect } from 'react';
import useSocket from 'use-socket.io-client';
import { useImmer } from 'use-immer';

import './index.css';
//secondary component messages
const Messages = (props) =>
	props.data.map(
		(m) =>
			m[0] !== '' ? (
				<li>
					<strong>{m[0]}</strong> : <div className="innermsg">{m[1]}</div>
				</li>
			) : (
				<li className="update">{m[1]}</li>
			)
	);
//third component
const Online = (props) => props.data.map((m) => <li id={m[0]}>{m[1]}</li>);
//first component
export default (app) => {
	//state
	const [ id, setId ] = useState('');
	const [ nameInput, setNameInput ] = useState('');
	const [ room, setRoom ] = useState('');
	const [ input, setInput ] = useState('');
	//state that sockets into server
	const [ socket ] = useSocket('https://open-chat-naostsaecf.now.sh');
	socket.connect();
	//use immer to map not original
	const [ messages, setMessages ] = useImmer([]);

	const [ online, setOnline ] = useImmer([]);
	//use effect to ping on different sockket events
	useEffect(() => {
		//pushes new messages
		socket.on('message que', (nick, message) => {
			setMessages((draft) => {
				console.log(draft);
				draft.push([ nick, message ]);
			});
		});
		//updates
		socket.on('update', (message) =>
			setMessages((draft) => {
				draft.push([ '', message ]);
			})
		);
		//uses people list
		socket.on('people-list', (people) => {
			let newState = [];
			for (let person in people) {
				newState.push([ people[person].id, people[person].nick ]);
			}
			setOnline((draft) => {
				draft.push(...newState);
			});
			console.log(online);
		});
		//adds person
		socket.on('add-person', (nick, id) => {
			setOnline((draft) => {
				draft.push([ id, nick ]);
			});
		});
		//deletes person
		socket.on('remove-person', (id) => {
			setOnline((draft) => draft.filter((m) => m[0] !== id));
		});
		//creates message
		socket.on('chat message', (nick, message) => {
			setMessages((draft) => {
				draft.push([ nick, message ]);
			});
		});
	}, 0);
	//function when user pushes submit on initial form
	const handleSubmit = (e) => {
		e.preventDefault();
		if (!nameInput) {
			return alert("Name can't be empty");
		}
		setId(nameInput);
		socket.emit('join', nameInput, room);
	};
	//handles message send
	const handleSend = (e) => {
		e.preventDefault();
		if (input !== '') {
			socket.emit('chat message', input, room);
			setInput('');
		}
	};

	return id ? (
		<section style={{ display: 'flex', flexDirection: 'row' }}>
			<ul id="messages">
				<Messages data={messages} />
			</ul>
			<ul id="online">
				{' '}
				🌐 : <Online data={online} />{' '}
			</ul>
			<div id="sendform">
				<form onSubmit={(e) => handleSend(e)} style={{ display: 'flex' }}>
					<input id="m" onChange={(e) => setInput(e.target.value.trim())} />
					<button style={{ width: '75px' }} type="submit">
						Send
					</button>
				</form>
			</div>
		</section>
	) : (
		<div style={{ textAlign: 'center', margin: '30vh auto', width: '70%' }}>
			<form onSubmit={(event) => handleSubmit(event)}>
				<input
					id="name"
					onChange={(e) => setNameInput(e.target.value.trim())}
					required
					placeholder="What is your name .."
				/>
				<br />
				<input id="room" onChange={(e) => setRoom(e.target.value.trim())} placeholder="What is your room .." />
				<br />
				<button type="submit">Submit</button>
			</form>
		</div>
	);
};
