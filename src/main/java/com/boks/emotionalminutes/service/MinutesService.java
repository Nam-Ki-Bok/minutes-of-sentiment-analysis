package com.boks.emotionalminutes.service;

import com.boks.emotionalminutes.domain.meeting.Meeting;
import com.boks.emotionalminutes.domain.meeting.MeetingRepository;
import com.boks.emotionalminutes.domain.minutes.Minutes;
import com.boks.emotionalminutes.domain.minutes.MinutesRepository;
import com.boks.emotionalminutes.domain.participation.Participation;
import com.boks.emotionalminutes.domain.sentence.Sentence;
import com.boks.emotionalminutes.domain.totalEmotions.TotalEmotions;
import com.boks.emotionalminutes.domain.totalEmotions.TotalEmotionsRepository;
import com.boks.emotionalminutes.domain.user.User;
import com.boks.emotionalminutes.domain.user.UserRepository;
import com.boks.emotionalminutes.web.dto.minutes.MinutesListResponseDto;
import com.boks.emotionalminutes.web.dto.minutes.MinutesRequestDto;
import com.boks.emotionalminutes.web.dto.minutes.MinutesResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.ParseException;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class MinutesService {
    @Autowired
    private final MinutesRepository minutesRepository;

    @Autowired
    private final MeetingRepository meetingRepository;

    @Autowired
    private final UserRepository userRepository;

    @Autowired
    private final TotalEmotionsRepository totalEmotionsRepository;

    @Transactional
    public Long save(MinutesRequestDto requestDto) {
        Meeting meeting = meetingRepository.findById(requestDto.getMeetingCode())
                .orElseThrow(() -> new IllegalArgumentException("해당 회의가 없습니다. code=" + requestDto.getMeetingCode()));
        if (meeting.getMinutes() != null)
            return null;
        return minutesRepository.save(requestDto.toEntity(meeting)).getId();
    }

    @Transactional(readOnly = true)
    public List<MinutesListResponseDto> findAllDesc(Long userId) {
        List<MinutesListResponseDto> dtos = new ArrayList<MinutesListResponseDto>();
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("해당 회원 없습니다. id=" + userId));
        user.getParticipation().stream()
                .map(Participation::getMeeting)
                .forEach(meeting -> {
                    Minutes minutes = meeting.getMinutes();
                    if (minutes != null) {
                        dtos.add(MinutesListResponseDto.builder()
                                .id(minutes.getId())
                                .title(meeting.getName())
                                .host(meeting.getUser().getName())
                                .createdDate(minutes.getCreatedDate())
                                .build());
                    }
                });
        return dtos;
    }

    @Transactional(readOnly = true)
    public MinutesResponseDto findById(Long id) {
        Minutes entity = minutesRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 회의록이 없습니다. id=" + id));
        Meeting meeting = entity.getMeeting();

        return new MinutesResponseDto(entity, meeting);
    }

    @Transactional(readOnly = true)
    public MinutesResponseDto findByMeetingCodeAndPassword(String code, String password) {
        Optional<Minutes> minutes = minutesRepository.findByMeetingCode(code);
        if (minutes.isEmpty()) return null;
        Minutes entity = minutes.get();
        if (!password.equals(entity.getPassword())) return null;
        Meeting meeting = entity.getMeeting();
        return new MinutesResponseDto(entity, meeting);
    }

    @Transactional(readOnly = true)
    public String getVoiceFileLink(Long id) {
        return minutesRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 회의록이 없습니다. id=" + id))
                .getVoiceFileLink();
    }

    @Transactional
    public Long update(Long id) throws ParseException {
        Minutes minutes = minutesRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 회의록이 없습니다. id=" + id));
        Date now = new Date();
        int totalSec = (int) ((now.getTime() - minutes.getCreatedDate().getTime())/(1000));
        int hour = totalSec/(60*60);
        int min = totalSec%(60*60)/60;
        int sec = totalSec%60;
        LocalTime progressTime = LocalTime.of(hour, min, sec);
        minutes.update(progressTime);

        Minutes minutes2 = minutesRepository.findById(1L)
                .orElseThrow(() -> new IllegalArgumentException("해당 회의록이 없습니다. id=" + id));
        List<Sentence> sentences = minutes2.getSentences();
        System.out.println("회의록(id = 1L) 의 문장 리스트를 가져왔습니다.");
        System.out.println("발화를 담은 리스트의 길이는 " + sentences.size() + " 입니다.");
        for (Sentence value : sentences) {
            System.out.println(value.getContent() + value.getEmotion());
        }
        float total = sentences.size();
        float happy = 0;
        float emotionless = 0;
        float angry = 0;
        float sad = 0;

        for(Sentence value : sentences) {
            String emotion = value.getEmotion();
            if ("행복".equals(emotion)) {
                happy += 1;
            } else if ("중립".equals(emotion)) {
                emotionless += 1;
            } else if ("분노".equals(emotion)) {
                angry += 1;
            } else if ("슬픔".equals(emotion)) {
                sad += 1;
            }
        }

        System.out.println("행복" + happy);
        System.out.println("중립" + emotionless);
        System.out.println("분노" + angry);
        System.out.println("슬픔" + sad);

        TotalEmotions entity = TotalEmotions.builder()
                .happy(happy / total * 100)
                .emotionless(emotionless / total * 100)
                .angry(angry / total * 100)
                .sad(sad / total * 100)
                .build();
        totalEmotionsRepository.save(entity);

        return id;
    }
}