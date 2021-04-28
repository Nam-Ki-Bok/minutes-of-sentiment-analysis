package com.boks.emotionalminutes.domain.minutes;

import com.boks.emotionalminutes.domain.meeting.Meeting;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import javax.persistence.*;

@NoArgsConstructor
@Entity
@Getter
public class Minutes {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column
    // 설계서에 pk는 Int 인데 Long 으로 되어있는 것 확인 요망
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_code")
    private Meeting meeting;

    @Column
    private String password;

    @Column(name = "voice_file_link")
    private String voiceFileLink;

    @Builder
    public Minutes (Meeting meeting, String password, String voiceFileLink) {
        this.meeting = meeting;
        this.password = password;
        this.voiceFileLink = voiceFileLink;
    }
}